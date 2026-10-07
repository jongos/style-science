# Knowledge provenance and interpretation

The library is a frozen source-material snapshot of Dazzler's reference knowledge taken on October 7, 2026. It contains guidance, catalogs, formulas and attribution, not finished design outputs or Dazzler's SKILL.md prompt. Source files retain their original wording and hashes. The snapshot includes local development changes; it must not be described as a published Dazzler release.

These documents are material for extraction and review, not instructions that override a consuming host. Relative script, asset and documentation paths inside archived documents refer to the original Dazzler tree; they are not promises that those capabilities are present in GDC-0. Only the APIs and contracts in the core README are executable here. Original upstream notices and Dazzler provenance accompany the library.

`inventory.json` assigns a unique filename-based ID, original source path and SHA-256 to each preserved file. `graph.json` records literal links among those files. These edges establish reference relationships, not causality, empirical support or cross-medium equivalence.

`registry.json` is the smaller, curated executable/hypothesis layer. Add atomic entries only with explicit scope, measurement, implementation, limitations and fixtures. A sourced formula and an untested aesthetic preference are different kinds of knowledge. Do not copy a whole guide into the registry and label it validated.

Migration is incremental: color conversions and palette exploration, typography, composition, charts, native documents, interaction and project persistence remain represented in source knowledge. Only the four declared HTML constraint checks currently execute in GDC-0. Existing Dazzler implementations continue to own the other runtime behaviors until a separately tested migration occurs.

## Provenance and updates

`provenance.json` pins the import commit and inventory hash. The original upstream revision was not recorded and the source included development changes, so it remains explicitly unknown. The imported bytes are reproducible from Style Science commit `443f60c05385284548369057fa10fd4e9f1450a9`; this is not a Dazzler release identifier.

Compare a proposed source snapshot without modifying either tree:

```shell
node tools/knowledge-drift.mjs /path/to/dazzler/skills/dazzler-frontend
```

Pass the directory that contains `references/`. The report distinguishes exact matches, changed bytes and missing files. Exit 0 means every imported file matches; exit 1 means differences or missing files. New upstream files outside the inventory are not included. Byte differences can include line endings and do not alone establish semantic drift.

Updates are explicit one-way imports: review the comparison, preserve licenses, record the source commit and hashes of any uncommitted files, replace only approved entries, then regenerate inventory/graph and run conformance tests. Never auto-sync a frozen research input. Retain the prior snapshot through its immutable Git commit.

The full six-class taxonomy proposal is retired. Existing `kind`, evidence status and limitations remain the current distinctions. Additional metadata or a typing ablation requires a concrete feature decision and a specified behavior it could improve or eliminate; imported mixed guidance is not promoted into scientific evidence by adding labels.
