# Useful shortlists, with permission to say no

`retrieval.mjs` and `retrieval.py` implement experimental index schema 1.
Briefs name contexts, task, audience, content, interaction needs, medium and intent.
Hard palette/font locks, declared interaction compatibility, font availability and
optional token contrast are checked before ranking. Missing capability information
is unknown. Incompatible candidates are never rescued by an agreement score.

Soft scoring is deliberately inspectable: four points for context coverage, two
for an exact intent label, then up to one for ASCII lexical overlap. These weights
are engineering heuristics. Equal suitability is diversified by arrangement,
typography category and named color relationship; only then can model agreement
break a tie. A request/ID hash settles exact ties without using corpus order,
category population or popularity. The category differences are not perceptual
distances or human-validated diversity.

`loadDetail` reads only a requested local detail through a host callback and checks
its hash. Coordinated recipe parameters remain together; output is never a newly
validated design. Font licenses/weights, actual glyph fallback, adaptation and
rendered delivery still need host checks.

An explicit, offline index build is available:

```powershell
node tools/build_recipe_index.mjs <winner-json> <new-output-directory> html
```

No input directory is scanned. Only supplied winners are indexed, and complete
details are stored separately. Missing interaction/intent metadata is not invented.
The existing 1,000-winner file was read explicitly to create an ignored local index;
its source hash and original bytes remain unchanged. No loser was reconstructed.

The held-out synthetic comparison uses a lexical proxy with the same ten-entry
index and three-entry output limit. It is not yet the full Dazzler helper/agent
benchmark; that external-validity part of #15 and #18 remains open.
