"""Experimental design-language contracts; interoperable with language.mjs."""
import hashlib
import json
import math
import re
from gdc import contrast

LANGUAGE_VERSION = "0.1.0"
CONTEXT_KEYS = ["task", "audience", "medium", "intent"]
EVIDENCE_KINDS = ["computed", "rendered", "observational", "randomized", "model-prediction", "synthetic"]
JS_WHITESPACE = "\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"


def _text(x):
    return isinstance(x, str) and bool(x.strip(JS_WHITESPACE)) and not re.search(r"[\ud800-\udfff]", x) and len(x.encode("utf-16-le")) // 2 <= 4000


def _number(x):
    try:
        return type(x) in (int, float) and math.isfinite(x)
    except OverflowError:
        return False


def _fields(x, required, optional=()):
    if not isinstance(x, dict) or any(k not in x for k in required) or any(k not in required and k not in optional for k in x):
        raise ValueError("Invalid or unknown fields")


def _texts(values):
    if not all(_text(x) for x in values):
        raise ValueError("Expected bounded nonempty text")


def _list(x, maximum, allow_empty=False):
    if not isinstance(x, list) or len(x) > maximum or (not allow_empty and not x):
        raise ValueError("Invalid list length")


def _unique(values):
    if len(set(values)) != len(values):
        raise ValueError("Duplicate value")


def _context(x, incomplete=False):
    _fields(x, CONTEXT_KEYS)
    if not all(_text(v) or (incomplete and v is None) for v in x.values()):
        raise ValueError("Invalid context")


def _acyclic(nodes, edges):
    indegree = {n["id"]: 0 for n in nodes}
    following = {n["id"]: [] for n in nodes}
    for edge in edges:
        indegree[edge["to"]] += 1
        following[edge["from"]].append(edge["to"])
    queue = [key for key, value in indegree.items() if value == 0]
    visited = 0
    for key in queue:
        visited += 1
        for target in following[key]:
            indegree[target] -= 1
            if indegree[target] == 0:
                queue.append(target)
    if visited != len(nodes):
        raise ValueError("Cyclic relation")


def validate_design(design):
    _fields(design, ["languageVersion", "id", "revision", "context", "nodes", "relations"])
    if design["languageVersion"] != LANGUAGE_VERSION:
        raise ValueError("Unsupported language version")
    _texts([design["id"], design["revision"]])
    _context(design["context"])
    _list(design["nodes"], 256)
    _list(design["relations"], 1024, True)
    for node in design["nodes"]:
        _fields(node, ["id", "kind", "role", "tokenRefs"])
        _texts([node["id"], node["role"]])
        if node["kind"] not in ["group", "text", "image", "action", "data"]:
            raise ValueError("Unsupported node kind")
        _list(node["tokenRefs"], 64, True)
        _texts(node["tokenRefs"])
        _unique(node["tokenRefs"])
    _unique([n["id"] for n in design["nodes"]])
    nodes = {n["id"]: n for n in design["nodes"]}
    identities, parents = [], []
    for edge in design["relations"]:
        _fields(edge, ["id", "kind", "from", "to"])
        _texts([edge["id"], edge["from"], edge["to"]])
        if edge["kind"] not in ["contains", "precedes", "groups-with", "emphasizes"] or edge["from"] not in nodes or edge["to"] not in nodes or edge["from"] == edge["to"]:
            raise ValueError("Unsupported or dangling relation")
        pair = [edge["from"], edge["to"]]
        if edge["kind"] == "groups-with":
            pair.sort()
        identities.append((edge["kind"], *pair))
        if edge["kind"] == "contains":
            if nodes[edge["from"]]["kind"] != "group":
                raise ValueError("Only a group may contain nodes")
            parents.append(edge["to"])
    _unique([r["id"] for r in design["relations"]])
    _unique(identities)
    _unique(parents)
    for kind in ["contains", "precedes", "emphasizes"]:
        _acyclic(design["nodes"], [r for r in design["relations"] if r["kind"] == kind])
    return design


def design_fingerprint(design):
    validate_design(design)
    canonical = json.dumps(design, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def assess_relations(design, capture):
    design_hash = design_fingerprint(design)
    base = {"languageVersion": LANGUAGE_VERSION, "designHash": design_hash, "automaticSelection": False,
            "scope": "Host-reported relation evidence only; not rendered or aesthetic verification."}
    if capture is None:
        return {**base, "status": "unknown", "reason": "missing-capture"}
    _fields(capture, ["designHash", "environment", "artifactRevision", "observations"])
    _texts([capture["designHash"], capture["environment"], capture["artifactRevision"]])
    _list(capture["observations"], 1024, True)
    ids = {r["id"] for r in design["relations"]}
    for observation in capture["observations"]:
        _fields(observation, ["relation", "status", "instrument", "source"])
        _texts([observation["relation"], observation["instrument"], observation["source"]])
        if observation["relation"] not in ids or observation["status"] not in ["pass", "fail", "unknown"]:
            raise ValueError("Invalid relation observation")
    _unique([o["relation"] for o in capture["observations"]])
    if capture["designHash"] != design_hash or capture["artifactRevision"] != design["revision"]:
        return {**base, "status": "unknown", "reason": "stale-capture"}
    if not design["relations"]:
        return {**base, "status": "unknown", "reason": "no-relations"}
    observations = {o["relation"]: o["status"] for o in capture["observations"]}
    results = [{"relation": r["id"], "status": observations.get(r["id"], "unknown")} for r in design["relations"]]
    statuses = [r["status"] for r in results]
    status = "fail" if "fail" in statuses else "unknown" if "unknown" in statuses else "pass"
    return {**base, "status": status, "environment": capture["environment"], "results": results}


def oklab(hex_color):
    if not isinstance(hex_color, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", hex_color):
        raise ValueError("Expected opaque six-digit sRGB hex")
    rgb = [int(hex_color[i:i+2], 16) / 255 for i in [1, 3, 5]]
    r, g, b = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    # Ottosson's 2021-01-25 matrices; Python 3.10 has no math.cbrt.
    l = (0.4122214708*r + 0.5363325363*g + 0.0514459929*b) ** (1/3)
    m = (0.2119034982*r + 0.6806995451*g + 0.1073969566*b) ** (1/3)
    s = (0.0883024619*r + 0.2817188376*g + 0.6299787005*b) ** (1/3)
    return {"L": 0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
            "a": 1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
            "b": 0.0259040371*l + 0.7827717662*m - 0.8086757660*s}


def describe_tokens(tokens):
    _fields(tokens, ["foreground", "background", "bodyPx", "headingPx", "lineHeightPx", "gapPx"])
    for key in ["bodyPx", "headingPx", "lineHeightPx", "gapPx"]:
        value = tokens[key]
        if not _number(value) or value > 16384 or (value < 0 if key == "gapPx" else value <= 0):
            raise ValueError("Invalid declared pixel dimension")
    foreground, background = oklab(tokens["foreground"]), oklab(tokens["background"])
    values = {"contrastRatio": contrast(tokens["foreground"], tokens["background"]),
              "typeRatio": tokens["headingPx"] / tokens["bodyPx"],
              "lineHeightRatio": tokens["lineHeightPx"] / tokens["bodyPx"],
              "gapRatio": tokens["gapPx"] / tokens["bodyPx"],
              "colorDistance": math.hypot(*[foreground[k] - background[k] for k in ["L", "a", "b"]])}
    if not all(_number(v) for v in values.values()):
        raise ValueError("Descriptor exceeds numeric range")
    return {"languageVersion": LANGUAGE_VERSION, "evidenceKind": "computed",
            "scope": "Declared tokens only; no rendered perception, font metrics, accessibility verdict, or beauty score.",
            "foreground": foreground, "background": background, **values}


def match_contexts(request, candidates):
    _context(request, True)
    _list(candidates, 10000, True)
    for candidate in candidates:
        _fields(candidate, ["id", "context"])
        _texts([candidate["id"]])
        _context(candidate["context"], True)
    _unique([c["id"] for c in candidates])
    missing = [k for k in CONTEXT_KEYS if request[k] is None]
    if missing:
        return {"status": "needs-context", "missing": missing, "eligible": [], "automaticSelection": False}
    results = []
    for candidate in candidates:
        missing = [k for k in CONTEXT_KEYS if candidate["context"][k] is None]
        mismatched = [k for k in CONTEXT_KEYS if candidate["context"][k] is not None and candidate["context"][k] != request[k]]
        results.append({"id": candidate["id"], "status": "out-of-scope" if mismatched else "unknown" if missing else "matching", "missing": missing, "mismatched": mismatched})
    return {"status": "advisory", "eligible": [r["id"] for r in results if r["status"] == "matching"], "results": results, "automaticSelection": False}


def assess_evidence(claim, evidence):
    _fields(claim, ["id", "kind", "context", "artifactRevision", "instrument"])
    _texts(list(claim.values()))
    compatible = {"numerical": ["computed"], "rendered": ["rendered"], "association": ["observational", "randomized"],
                  "causal": ["randomized"], "preference": ["observational", "randomized"], "model-advice": ["model-prediction"]}
    if claim["kind"] not in compatible:
        raise ValueError("Unsupported claim kind")
    base = {"languageVersion": LANGUAGE_VERSION, "claim": claim["id"], "automaticAction": False, "establishesClaim": False}
    if evidence is None:
        return {**base, "status": "unknown", "reason": "missing-evidence"}
    _fields(evidence, ["id", "kind", "context", "artifactRevision", "instrument", "source", "limitations", "protocol"])
    _texts([evidence[k] for k in ["id", "context", "artifactRevision", "instrument", "source"]])
    _list(evidence["limitations"], 32)
    _texts(evidence["limitations"])
    if evidence["kind"] not in EVIDENCE_KINDS or not (evidence["protocol"] is None or _text(evidence["protocol"])):
        raise ValueError("Invalid evidence kind or protocol")
    for key in ["context", "artifactRevision", "instrument"]:
        if evidence[key] != claim[key]:
            return {**base, "status": "unknown", "reason": key + "-mismatch"}
    if evidence["kind"] not in compatible[claim["kind"]]:
        return {**base, "status": "unknown", "reason": "incompatible-evidence"}
    if claim["kind"] in ["causal", "preference"] and evidence["protocol"] is None:
        return {**base, "status": "unknown", "reason": "missing-protocol"}
    return {**base, "status": "ready-for-review", "evidence": evidence["id"], "limitations": list(evidence["limitations"])}


def audit_corpus(records):
    _list(records, 100000)
    issues, splits, groups = [], {"train": 0, "validation": 0, "test": 0}, {}
    for record in records:
        _fields(record, ["id", "split", "sourceGroup", "brandGroup", "templateGroup", "contentHash", "rights", "evidenceKind"])
        _texts([record["id"]])
        if not isinstance(record["split"], str) or record["split"] not in splits or record["evidenceKind"] not in EVIDENCE_KINDS:
            raise ValueError("Invalid split or evidence kind")
        if record["contentHash"] is not None and (not isinstance(record["contentHash"], str) or not re.fullmatch(r"[a-f0-9]{64}", record["contentHash"])):
            raise ValueError("Invalid SHA-256")
        rights = record["rights"]
        _fields(rights, ["training", "license", "source"])
        if rights["training"] not in ["cleared", "unknown", "denied"]:
            raise ValueError("Invalid rights status")
        for key in ["license", "source"]:
            if rights[key] is not None and not _text(rights[key]):
                raise ValueError("Invalid rights provenance")
        if rights["training"] != "cleared" or not _text(rights["license"]) or not _text(rights["source"]):
            issues.append({"id": record["id"], "reason": "rights-not-cleared"})
        splits[record["split"]] += 1
        for key in ["sourceGroup", "brandGroup", "templateGroup", "contentHash"]:
            if record[key] is None:
                issues.append({"id": record["id"], "reason": "missing-group", "field": key})
                continue
            _texts([record[key]])
            identity = (key, record[key])
            if identity not in groups:
                groups[identity] = {"field": key, "value": record[key], "splits": set(), "ids": []}
            group = groups[identity]
            group["splits"].add(record["split"])
            group["ids"].append(record["id"])
        if record["split"] != "train" and record["evidenceKind"] in ["synthetic", "model-prediction"]:
            issues.append({"id": record["id"], "reason": "not-independent-evaluation"})
    _unique([r["id"] for r in records])
    for group in groups.values():
        if len(group["splits"]) > 1:
            issues.append({"reason": "split-leakage", "field": group["field"], "value": group["value"], "ids": group["ids"]})
    for split, count in splits.items():
        if not count:
            issues.append({"reason": "empty-split", "split": split})
    return {"languageVersion": LANGUAGE_VERSION, "status": "blocked" if issues else "ready-for-review", "splits": splits, "issues": issues,
            "trainingAuthorized": False, "scope": "Supplied metadata only; no legal clearance, semantic deduplication, or independent-label verification."}
