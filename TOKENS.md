# Experimental token interchange

`tokens.mjs` and `tokens.py` implement an original, dependency-free subset of
[DTCG Format 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/).
The specification informs the interchange semantics; no upstream implementation
code is imported. This is the first implementation from the related-work review.

```js
import {importTokens, exportTokens} from './tokens.mjs';
const source = {
  spacing: {$type: 'dimension', small: {$value: {value: 8, unit: 'px'}}},
  gap: {$value: '{spacing.small}'}
};
const report = importTokens(source);
if (report.status === 'supported') {
  // report.tokens contains resolved values and alias dependencies.
  const roundTrip = JSON.parse(exportTokens(report.sourceDocument));
}
```

```python
from tokens import import_tokens, export_tokens
source = {'size': {'$type': 'number', '$value': 1.25}}
report = import_tokens(source)
if report['status'] == 'supported':
    serialized = export_tokens(report['sourceDocument'])
```

Supported: numbers, dimensions in `px`/`rem`, font-family strings/fallback lists,
group type inheritance, explicit types, curly-brace whole-token aliases and
chains. Alias target type takes precedence over parent-group type when the alias
has no explicit type. An explicit mismatch fails. Output distinguishes literal
from alias values and records the dependency chain.

Descriptions, deprecation and opaque extensions stay in the source document.
They are not executed, inferred as constraints or represented as measurements.
`evidenceClass` is `declared-tokens`, and `qualityClaim` is always false. This API
does not change verification eligibility, infer contrast or certify font loading.

Failures return `invalid` or `unsupported`, diagnostic JSON Pointer paths/codes,
an empty `tokens` list and null `sourceDocument`. Export revalidates and raises on
either failure status. Nothing is flattened or partially exported. Unsupported
does not mean invalid under the full DTCG standard; it means this adapter cannot
interpret the document safely within its declared subset.

Not supported: colors, composites, other token types, JSON Pointer resolution,
group extensions, `$root` or arbitrary fields. No color/unit conversion occurs.
The interface accepts already-parsed JSON; callers must reject duplicate keys
before import. Whitespace, object-key order, numeric spelling and negative-zero
spelling are not preserved. Parsed numbers use the host's numeric precision.
The subset bounds numeric magnitude at 2^53 - 1, document depth at 32, JSON value
nodes at 4096 and alias chains at 128 hops. Nonfinite values and lone surrogates
are rejected. See the [protocol](evaluation/TOKEN-INTERCHANGE.md) for fixtures.

The module is available by direct file import in this research checkout. It is
not added to the committed release manifest or stable package exports. No full
DTCG conformance or interoperability with the other reviewed projects is claimed.
