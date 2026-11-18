"""Declared token/CSS design self-check without rendered observations. Standard library only."""

import json
import math
import re
import sys
from pathlib import Path

from tokens import import_tokens

DEFAULT_POLICY = {
    "spacingGridPx": 4,
    "minDistinctFontSizes": 3,
    "contrastBody": 4.5,
    "contrastLarge": 3,
    "largeTextPx": 24,
}


def _scalar(value):
    return isinstance(value, str) and value and not any(0xD800 <= ord(c) <= 0xDFFF for c in value)


def _hex6(value):
    return isinstance(value, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", value)


def _parse_px(value):
    if not isinstance(value, str):
        return None
    match = re.fullmatch(r"([\d.]+)px", value.strip(), re.I)
    return float(match.group(1)) if match else None


def _parse_rem(value, root_px=16.0):
    if not isinstance(value, str):
        return None
    match = re.fullmatch(r"([\d.]+)rem", value.strip(), re.I)
    return float(match.group(1)) * root_px if match else None


def collect_font_sizes_px(css, root_px=16.0):
    if not isinstance(css, str) or not css.strip():
        return []
    out = set()
    for match in re.finditer(r"font-size\s*:\s*([^;}{]+)", css, re.I):
        token = match.group(1).strip().split()[0]
        px = _parse_px(token)
        if px is None:
            px = _parse_rem(token, root_px)
        if px is not None and math.isfinite(px):
            out.add(round(px, 3))
    return sorted(out)


def collect_spacing_px(css):
    if not isinstance(css, str) or not css.strip():
        return []
    out = []
    for match in re.finditer(
        r"(?:margin|padding|gap|row-gap|column-gap)(?:-[a-z]+)?\s*:\s*([^;}{]+)", css, re.I
    ):
        for part in match.group(1).split():
            px = _parse_px(part)
            if px is not None:
                out.append(px)
    return out


def contrast(a, b):
    def luminance(hex_color):
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", hex_color):
            raise ValueError("Opaque sRGB hex required")
        comps = [int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
        linear = [
            v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in comps
        ]
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]

    lighter = max(luminance(a), luminance(b))
    darker = min(luminance(a), luminance(b))
    return (lighter + 0.05) / (darker + 0.05)


def _status_from(results):
    if any(r.get("status") == "fail" for r in results):
        return "fail"
    if any(r.get("status") == "unknown" for r in results):
        return "unknown"
    if results:
        return "pass"
    return "unknown"


def run_design_self_check(input_payload=None):
    if input_payload is None:
        input_payload = {}
    if not isinstance(input_payload, dict):
        raise ValueError("Input must be an object")
    policy = {**DEFAULT_POLICY, **(input_payload.get("policy") or {})}
    results = []
    candidates = []

    if "tokens" in input_payload:
        report = import_tokens(input_payload["tokens"])
        status = (
            "pass"
            if report["status"] == "supported"
            else "fail"
            if report["status"] == "invalid"
            else "unknown"
        )
        results.append(
            {
                "id": "tokens-import",
                "kind": "declared",
                "status": status,
                "detail": report["status"],
                "diagnostics": len(report["diagnostics"]),
            }
        )
        px_vals = [
            t["value"]["value"]
            for t in report["tokens"]
            if t["type"] == "dimension"
            and isinstance(t.get("value"), dict)
            and t["value"].get("unit") == "px"
        ]
        rem_vals = [
            t["value"]["value"]
            for t in report["tokens"]
            if t["type"] == "dimension"
            and isinstance(t.get("value"), dict)
            and t["value"].get("unit") == "rem"
        ]
        grid = policy["spacingGridPx"]
        off = [v for v in px_vals if abs(v % grid) > 0.001]
        if px_vals:
            candidates.append(
                {
                    "id": "token-spacing-grid",
                    "kind": "candidate",
                    "status": "fail" if off else "pass",
                    "measured": {
                        "onGrid": len(px_vals) - len(off),
                        "offGrid": len(off),
                        "gridPx": grid,
                        "examples": off[:5],
                    },
                    "scope": "Declared px dimensions only; not a complete spacing audit",
                }
            )
        elif rem_vals:
            candidates.append(
                {
                    "id": "token-spacing-grid",
                    "kind": "candidate",
                    "status": "unknown",
                    "detail": "Only rem dimensions present; no px grid test",
                }
            )

    pairs = input_payload.get("contrastPairs") or []
    if not pairs:
        results.append(
            {
                "id": "contrast-pairs",
                "kind": "declared",
                "status": "unknown",
                "detail": "No contrastPairs supplied",
            }
        )
    else:
        for index, pair in enumerate(pairs):
            pair_id = pair.get("id") if _scalar(pair.get("id")) else f"pair-{index + 1}"
            if not _hex6(pair.get("foreground")) or not _hex6(pair.get("background")):
                results.append(
                    {
                        "id": pair_id,
                        "kind": "declared",
                        "check": "contrast",
                        "status": "unknown",
                        "detail": "Opaque #rrggbb required",
                    }
                )
                continue
            ratio = contrast(pair["foreground"], pair["background"])
            large = pair.get("largeText") is True or (
                isinstance(pair.get("fontSizePx"), (int, float))
                and pair["fontSizePx"] >= policy["largeTextPx"]
            )
            minimum = (
                pair["minRatio"]
                if isinstance(pair.get("minRatio"), (int, float))
                else policy["contrastLarge"]
                if large
                else policy["contrastBody"]
            )
            results.append(
                {
                    "id": pair_id,
                    "kind": "declared",
                    "check": "contrast",
                    "status": "pass" if ratio >= minimum else "fail",
                    "ratio": round(ratio, 2),
                    "required": minimum,
                    "foreground": pair["foreground"].lower(),
                    "background": pair["background"].lower(),
                }
            )

    css = input_payload.get("css")
    if isinstance(css, str) and css.strip():
        focus_visible = ":focus-visible" in css
        focus_styled = bool(
            re.search(r":focus\b[^}{]*\{[^}]*\b(outline|box-shadow)\b", css, re.I | re.S)
        )
        results.append(
            {
                "id": "css-focus",
                "kind": "declared",
                "status": "pass" if focus_visible or focus_styled else "fail",
                "detail": (
                    ":focus-visible present"
                    if focus_visible
                    else ":focus styles present"
                    if focus_styled
                    else "No focus-visible or focus outline/box-shadow found"
                ),
            }
        )
        reduced = bool(
            re.search(r"@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)", css, re.I)
        )
        results.append(
            {
                "id": "css-reduced-motion",
                "kind": "declared",
                "status": "pass" if reduced else "fail",
                "detail": "prefers-reduced-motion block present"
                if reduced
                else "No reduced-motion media query",
            }
        )
        sizes = collect_font_sizes_px(css)
        min_steps = policy["minDistinctFontSizes"]
        if sizes:
            candidates.append(
                {
                    "id": "css-type-scale",
                    "kind": "candidate",
                    "status": "pass" if len(sizes) >= min_steps else "fail",
                    "measured": {"distinctSizes": len(sizes), "sizes": sizes},
                    "scope": "font-size declarations in supplied CSS only",
                }
            )
        else:
            candidates.append(
                {
                    "id": "css-type-scale",
                    "kind": "candidate",
                    "status": "unknown",
                    "detail": "No font-size values found",
                }
            )
        spacing = collect_spacing_px(css)
        grid = policy["spacingGridPx"]
        off = [v for v in spacing if abs(v % grid) > 0.001]
        if spacing:
            candidates.append(
                {
                    "id": "css-spacing-grid",
                    "kind": "candidate",
                    "status": "fail" if off else "pass",
                    "measured": {
                        "values": len(spacing),
                        "offGrid": len(off),
                        "gridPx": grid,
                        "examples": off[:5],
                    },
                    "scope": "margin/padding/gap px values in supplied CSS only",
                }
            )
        var_colors = bool(re.search(r"var\s*\(--[^)]+\)", css))
        chunks = re.split(r"\{[^}]*\}", css)
        hex_outside = any(re.search(r"#[0-9a-fA-F]{3,8}\b", chunk) for chunk in chunks)
        candidates.append(
            {
                "id": "css-token-indirection",
                "kind": "candidate",
                "status": "pass" if var_colors and not hex_outside else "unknown",
                "measured": {"usesCustomProperties": var_colors, "hexOutsideDeclarations": hex_outside},
                "scope": "Heuristic only; inline styles and preprocessors may bypass this",
            }
        )
    elif css is not None:
        results.append(
            {
                "id": "css-source",
                "kind": "declared",
                "status": "unknown",
                "detail": "Empty or non-string css",
            }
        )

    declared = [r for r in results if r.get("kind") == "declared"]
    return {
        "schemaVersion": 1,
        "status": _status_from(declared),
        "results": results,
        "candidates": candidates,
        "qualityClaim": False,
        "scope": "Declared tokens and CSS text only; not layout, imagery, branding fit or rendered accessibility certification",
    }


if __name__ == "__main__":
    try:
        payload = (
            json.load(sys.stdin)
            if not sys.argv[1:]
            else json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
        )
        print(json.dumps(run_design_self_check(payload), indent=2))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc