# Token interchange experiment

Protocol established before implementation, October 8, 2026. This is an offline
engineering experiment using original synthetic fixtures, not a human study.

Source: [DTCG Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/),
especially sections 5.2.2, 7 and 8. This is a partial adapter, not a conforming
implementation of the full specification. No upstream code is copied.

## Question and decision

Can a small adapter preserve supported token meaning, aliases and rationale
across JavaScript and Python without guessing or promoting declarations to
evidence? Compare it with a deliberately naive baseline that merely collects
`$value` leaves without resolving or validating them.

Retain the adapter for research only if all supported fixtures round-trip without
semantic changes, both runtimes agree, and it rejects at least one unsupported
or invalid input the baseline accepts. Any silent loss, type mismatch or cycle
accepted as usable blocks retention. No claim about design quality follows.

## Bounded contract

- Accept parsed JSON objects, not source text. Duplicate-key detection belongs
  to the host parser; whitespace, key order and numerical spelling are not preserved.
- Support number, dimension (`px`/`rem`) and fontFamily values; nested groups;
  explicit and inherited types; whole-token curly-brace aliases and chains.
- Preserve descriptions, deprecation metadata and opaque extensions in the
  source document. They are untrusted data, never executable instructions or
  inferred constraints. Extensions are not interpreted.
- Reject missing or cyclic references and mismatched alias types. Return
  unsupported for other known types, JSON Pointer references, group extensions,
  `$root`, and unrecognized fields. Never return a usable partial token list.
- Keep units and font fallback order exactly; do not normalize units or infer
  font availability. Numeric values must be finite and within the shared safe
  magnitude of 2^53 - 1. Documents have depth/node limits; aliases have a hop limit.
- Export revalidates a source document and preserves its JSON data model,
  including aliases, rather than flattening its resolved values.

## Fixtures and execution

Development: direct values, inherited types, alias chains, description/extension
preservation, unsupported type, missing reference, cycle, mismatched type.

Held-out cases, fixed here before implementation: an alias under a differently
typed parent, a forward reference, escaped Unicode names, token/group confusion,
prototype-like names, a diamond dependency, bad unit, malformed metadata, empty
document, unsupported pointer, nonfinite numeric values and bounded-depth/hop
failures. All failures remain in the regression suite.

Run `node --test tokens.test.mjs`. This resolves Python with the existing project
helper. No browser, network, Jev, installation or production default change.

## Initial result

The four regression groups pass: supported-data round trips; invalid/unsupported
input rejection and export blocking; JavaScript/Python report and exported-data
parity; and comparison with the naive leaf collector. The collector accepts
leaves from more than twenty negative fixtures that the adapter blocks. This
demonstrates the value of validation over that intentionally weak baseline, not
superiority over existing token tools. A follow-up diagnostic fixture verifies
that aliases to unsupported types remain unsupported rather than malformed.

Decision: retain as an experimental file-import module. No stable export or
release-manifest entry is added. Full standards conformance, precision beyond
host parsed-number semantics, other-project integration and user benefit remain
unmeasured. The broader related-work proposals remain queued, not implemented.
