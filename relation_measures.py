"""Observable relation proxies. No semantic or perceptual inference."""
import hashlib
import math
from gdc import _canonical
from language import design_fingerprint, _text

RELATION_MEASURE_VERSION = "0.1.0"
COMPATIBLE = {"dom-parent": "contains", "box-contains": "contains", "dom-before": "precedes",
              "y-before": "precedes", "x-before": "precedes", "x-after": "precedes"}


def _keys(x, names):
    return isinstance(x, dict) and set(x) == set(names)


def _finite(x):
    try:
        return type(x) in (int, float) and math.isfinite(x)
    except OverflowError:
        return False


def _unique(xs):
    return len(set(xs)) == len(xs)


def validate_relation_plan(design, plan):
    design_hash = design_fingerprint(design)
    if not _keys(plan, ["schemaVersion", "id", "designHash", "bindings", "environments", "requirements"]) or type(plan["schemaVersion"]) not in (int, float) or plan["schemaVersion"] != 1 or not _text(plan["id"]) or plan["designHash"] != design_hash:
        raise ValueError("Invalid or stale relation plan")
    if not isinstance(plan["bindings"], list) or len(plan["bindings"]) != len(design["nodes"]):
        raise ValueError("Bind every declared node")
    for binding in plan["bindings"]:
        if not _keys(binding, ["node", "selector"]) or not any(n["id"] == binding["node"] for n in design["nodes"]) or not _text(binding["selector"]):
            raise ValueError("Invalid node binding")
    if not _unique([b["node"] for b in plan["bindings"]]):
        raise ValueError("Duplicate node binding")
    if not isinstance(plan["environments"], list) or not 1 <= len(plan["environments"]) <= 32:
        raise ValueError("Declare 1-32 environments")
    for env in plan["environments"]:
        if not _keys(env, ["id", "width", "height", "colorScheme"]) or not _text(env["id"]) or not all(_finite(env[k]) and env[k] == int(env[k]) and 0 < env[k] <= 16384 for k in ["width", "height"]) or env["colorScheme"] not in ["light", "dark"]:
            raise ValueError("Invalid environment")
    if not _unique([e["id"] for e in plan["environments"]]):
        raise ValueError("Duplicate environment")
    if not isinstance(plan["requirements"], list) or not 1 <= len(plan["requirements"]) <= 128:
        raise ValueError("Declare 1-128 measurement requirements")
    for req in plan["requirements"]:
        if not _keys(req, ["id", "relation", "instrument"]) or not _text(req["id"]) or not isinstance(req["instrument"], str) or req["instrument"] not in COMPATIBLE or not any(r["id"] == req["relation"] and r["kind"] == COMPATIBLE[req["instrument"]] for r in design["relations"]):
            raise ValueError("Unsupported relation instrument")
    if not _unique([r["id"] for r in plan["requirements"]]) or not _unique([(r["relation"], r["instrument"]) for r in plan["requirements"]]):
        raise ValueError("Duplicate measurement requirement")
    return plan


def relation_plan_fingerprint(design, plan):
    validate_relation_plan(design, plan)
    return hashlib.sha256(_canonical(plan).encode("utf-8")).hexdigest()


def _box(x):
    return _keys(x, ["left", "top", "width", "height"]) and all(_finite(v) for v in x.values()) and x["width"] > 0 and x["height"] > 0 and _finite(x["left"] + x["width"]) and _finite(x["top"] + x["height"])


def evaluate_relation_measure(instrument, measurement):
    if not isinstance(instrument, str) or instrument not in COMPATIBLE:
        raise ValueError("Unsupported instrument")
    def unknown(reason):
        return {"status": "unknown", "reason": reason}
    if not isinstance(measurement, dict):
        return unknown("missing-measurement")
    if "unknown" in measurement:
        return unknown(measurement["unknown"] if _keys(measurement, ["unknown"]) and _text(measurement["unknown"]) else "malformed-measurement")
    if instrument in ["dom-parent", "dom-before"]:
        if not _keys(measurement, ["value"]) or type(measurement["value"]) is not bool:
            return unknown("malformed-measurement")
        return {"status": "pass" if measurement["value"] else "fail", "value": measurement["value"], "unit": "boolean"}
    if not _keys(measurement, ["from", "to"]) or not _box(measurement["from"]) or not _box(measurement["to"]):
        return unknown("malformed-boxes")
    a, b = measurement["from"], measurement["to"]
    if instrument == "box-contains":
        value = min(b["left"]-a["left"], b["top"]-a["top"], a["left"]+a["width"]-b["left"]-b["width"], a["top"]+a["height"]-b["top"]-b["height"])
    elif instrument == "y-before":
        value = b["top"]-a["top"]-a["height"]
    elif instrument == "x-before":
        value = b["left"]-a["left"]-a["width"]
    else:
        value = a["left"]-b["left"]-b["width"]
    if not _finite(value):
        return unknown("numeric-overflow")
    if value == 0:
        value = 0
    return {"status": "pass" if value >= 0 else "fail", "value": value, "unit": "css-px"}


def verify_relation_measures(design, plan, snapshots):
    plan_hash = relation_plan_fingerprint(design, plan)
    if not isinstance(snapshots, list) or len(snapshots) > 32:
        raise ValueError("Invalid snapshot list")
    for snapshot in snapshots:
        if not _keys(snapshot, ["schemaVersion", "planHash", "designHash", "artifactRevision", "environment", "measurements", "adapter", "renderer"]) or not _keys(snapshot["environment"], ["id", "width", "height", "colorScheme"]) or not any(e["id"] == snapshot["environment"]["id"] for e in plan["environments"]) or not isinstance(snapshot["measurements"], dict):
            raise ValueError("Malformed snapshot envelope")
        if any(not any(r["id"] == key for r in plan["requirements"]) for key in snapshot["measurements"]):
            raise ValueError("Undeclared measurement")
    if not _unique([s["environment"]["id"] for s in snapshots]):
        raise ValueError("Duplicate snapshot environment")
    results = []
    for environment in plan["environments"]:
        snapshot = next((s for s in snapshots if s["environment"]["id"] == environment["id"]), None)
        reason = None
        if snapshot is None:
            reason = "missing-snapshot"
        elif type(snapshot["schemaVersion"]) not in (int, float) or snapshot["schemaVersion"] != 1 or snapshot["planHash"] != plan_hash or snapshot["designHash"] != plan["designHash"] or snapshot["artifactRevision"] != design["revision"]:
            reason = "stale-snapshot"
        elif not all(type(snapshot["environment"][k]) is not bool and snapshot["environment"][k] == environment[k] for k in ["width", "height", "colorScheme"]):
            reason = "environment-mismatch"
        elif not _text(snapshot["adapter"]) or not _text(snapshot["renderer"]):
            reason = "missing-provenance"
        for req in plan["requirements"]:
            result = {"status": "unknown", "reason": reason} if reason else evaluate_relation_measure(req["instrument"], snapshot["measurements"].get(req["id"]))
            results.append({"environment": environment["id"], "requirement": req["id"], "relation": req["relation"], "instrument": req["instrument"], **result})
    statuses = [r["status"] for r in results]
    return {"relationMeasureVersion": RELATION_MEASURE_VERSION, "planHash": plan_hash,
            "status": "fail" if "fail" in statuses else "unknown" if "unknown" in statuses else "pass", "results": results,
            "unprobedRelations": [r["id"] for r in design["relations"] if not any(q["relation"] == r["id"] for q in plan["requirements"])],
            "semanticStatus": "not-assessed", "automaticSelection": False,
            "scope": "Declared DOM and border-box predicates only; no meaningful reading order, perceived grouping/emphasis, visibility coverage or accessibility verdict."}
