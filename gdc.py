"""Independent Python consumer of the GDC-0 contract. Standard library only.

Apache-2.0. Measures declared constraints; does not rank aesthetic quality.
"""

import hashlib
import json
import math
import re
import sys

VERSION = "0.1.0"


def _object(value, keys):
    if not isinstance(value, dict) or set(value) - set(keys):
        raise ValueError("Invalid or unknown fields")


def _text(value):
    if not isinstance(value, str) or not value.strip() or len(value) > 4000:
        raise ValueError("Expected bounded nonempty string")


def _number(value):
    return type(value) in (int, float) and math.isfinite(value)


def validate_plan(plan):
    _object(
        plan,
        ["schemaVersion", "id", "revision", "medium", "environments", "requirements"],
    )
    if (
        type(plan.get("schemaVersion")) is not int
        or plan["schemaVersion"] != 1
        or plan.get("medium") != "html"
    ):
        raise ValueError("Unsupported plan schema or medium")
    _text(plan.get("id"))
    _text(plan.get("revision"))
    for key, maximum in [("environments", 32), ("requirements", 128)]:
        values = plan.get(key)
        if not isinstance(values, list) or not 1 <= len(values) <= maximum:
            raise ValueError("Declare bounded nonempty " + key)
        if any(not isinstance(v, dict) for v in values):
            raise ValueError("Entries must be objects")
        ids = [v.get("id") for v in values]
        for value in ids:
            _text(value)
        if len(set(ids)) != len(ids):
            raise ValueError("Duplicate ID")
    for env in plan["environments"]:
        _object(env, ["id", "width", "height", "colorScheme"])
        for key in ["width", "height"]:
            if type(env.get(key)) is not int or not 1 <= env[key] <= 16384:
                raise ValueError("Invalid viewport")
        if env.get("colorScheme") not in ("light", "dark"):
            raise ValueError("Invalid color scheme")
    fields = {
        "viewport-overflow": [],
        "visible-text": ["selector", "text"],
        "text-contrast": ["selector", "minRatio"],
        "style-equals": ["selector", "property", "expected"],
    }
    for rule in plan["requirements"]:
        _object(
            rule,
            ["id", "check", "selector", "text", "minRatio", "property", "expected"],
        )
        if rule.get("check") not in fields:
            raise ValueError("Unsupported check")
        required = fields[rule["check"]]
        for key in ["selector", "text", "minRatio", "property", "expected"]:
            if key in required:
                value = rule.get(key)
                if key == "minRatio":
                    if not _number(value) or not 1 <= value <= 21:
                        raise ValueError("Contrast must be 1–21")
                else:
                    _text(value)
            elif key in rule:
                raise ValueError("Irrelevant requirement field")
        if "property" in rule and rule["property"] not in (
            "color",
            "background-color",
            "font-family",
            "font-size",
            "font-weight",
            "line-height",
            "letter-spacing",
            "text-align",
        ):
            raise ValueError("Unsupported computed style property")
    return plan


def _canonical(value):
    # Normalize integral floats to match JSON.stringify for the bounded plan numbers.
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    if isinstance(value, list):
        return "[" + ",".join(_canonical(v) for v in value) + "]"
    if isinstance(value, dict):
        return (
            "{"
            + ",".join(
                json.dumps(k, ensure_ascii=False) + ":" + _canonical(value[k])
                for k in sorted(value)
            )
            + "}"
        )
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def fingerprint(plan):
    return hashlib.sha256(_canonical(validate_plan(plan)).encode("utf-8")).hexdigest()


def contrast(a, b):
    def luminance(value):
        if not isinstance(value, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
            raise ValueError("Opaque sRGB hex required")
        channels = [int(value[i : i + 2], 16) / 255 for i in (1, 3, 5)]
        linear = [
            c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
            for c in channels
        ]
        return sum(c * w for c, w in zip(linear, (0.2126, 0.7152, 0.0722)))

    x, y = luminance(a), luminance(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)


def _measure(rule, measurement):
    if not isinstance(measurement, dict) or measurement.get("unknown"):
        return {
            "status": "unknown",
            "detail": (measurement or {}).get("unknown", "Measurement absent"),
        }
    kind = rule["check"]
    if kind == "viewport-overflow":
        scroll, client = measurement.get("scrollWidth"), measurement.get("clientWidth")
        if not _number(scroll) or not _number(client) or scroll < 0 or client <= 0:
            raise ValueError("Invalid dimensions")
        value = max(0, scroll - client)
        passed = value == 0
    elif kind == "visible-text":
        if type(measurement.get("visible")) is not bool or not isinstance(
            measurement.get("text"), str
        ):
            raise ValueError("Invalid visible text")
        value = measurement["visible"] and " ".join(rule["text"].split()) in " ".join(
            measurement["text"].split()
        )
        passed = value
    elif kind == "text-contrast":
        value = contrast(measurement.get("foreground"), measurement.get("background"))
        passed = value >= rule["minRatio"]
    else:
        value = measurement.get("value")
        if not isinstance(value, str):
            raise ValueError("Invalid computed style")
        passed = value == rule["expected"]
    return {"status": "pass" if passed else "fail", "value": value}


def verify(plan, snapshots):
    validate_plan(plan)
    if not isinstance(snapshots, list):
        raise ValueError("Snapshots must be an array")
    expected = {e["id"] for e in plan["environments"]}
    ids = [s.get("environment", {}).get("id") for s in snapshots]
    if len(set(ids)) != len(ids) or any(i not in expected for i in ids):
        raise ValueError("Duplicate or undeclared environment")
    digest = fingerprint(plan)
    results = []
    for env in plan["environments"]:
        snapshot = next(
            (s for s in snapshots if s.get("environment", {}).get("id") == env["id"]),
            None,
        )
        compatible = (
            snapshot
            and snapshot.get("planHash") == digest
            and snapshot.get("environment") == env
        )
        for rule in plan["requirements"]:
            try:
                result = (
                    _measure(rule, snapshot.get("measurements", {}).get(rule["id"]))
                    if compatible
                    else {
                        "status": "unknown",
                        "detail": "Missing snapshot or mismatched plan/environment",
                    }
                )
            except (ValueError, TypeError, AttributeError) as error:
                result = {"status": "unknown", "detail": str(error)}
            results.append(
                {
                    "environment": env["id"],
                    "requirement": rule["id"],
                    "check": rule["check"],
                    **result,
                }
            )
    statuses = {r["status"] for r in results}
    return {
        "schemaVersion": 1,
        "engineVersion": VERSION,
        "planHash": digest,
        "status": (
            "fail"
            if "fail" in statuses
            else "unknown" if "unknown" in statuses else "pass"
        ),
        "results": results,
        "scope": "Declared checks and captured states only; not accessibility certification or design quality. Supplied observations are not authenticated.",
    }


def filter_candidates(plan, candidates):
    ids = [c["id"] for c in candidates]
    for value in ids:
        _text(value)
    if len(set(ids)) != len(ids):
        raise ValueError("Duplicate ID")
    reports = [
        {"id": c["id"], "report": verify(plan, c["snapshots"])} for c in candidates
    ]
    return {
        "eligible": [c["id"] for c in reports if c["report"]["status"] == "pass"],
        "reports": reports,
        "selection": "No automatic aesthetic ranking. Compare feasible candidates using the brief and rendered review.",
    }


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("Usage: python gdc.py plan.json snapshots.json")
        with open(sys.argv[1], encoding="utf-8") as f:
            plan = json.load(f)
        with open(sys.argv[2], encoding="utf-8") as f:
            snapshots = json.load(f)
        result = verify(plan, snapshots)
        print(json.dumps(result, indent=2, ensure_ascii=True))
        sys.exit(0 if result["status"] == "pass" else 2)
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
