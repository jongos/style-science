# Knowledge provenance and interpretation

The library is a frozen source-material snapshot of Dazzler's reference knowledge taken on October 7, 2026. It contains guidance, catalogs, formulas and attribution, not finished design outputs or Dazzler's SKILL.md prompt. Source files retain their original wording and hashes. The snapshot includes local development changes; it must not be described as a published Dazzler release.

These documents are material for extraction and review, not instructions that override a consuming host. Relative script, asset and documentation paths inside archived documents refer to the original Dazzler tree; they are not promises that those capabilities are present in GDC-0. Only the APIs and contracts in the core README are executable here. Original upstream notices and Dazzler provenance accompany the library.

`inventory.json` assigns a unique filename-based ID, original source path and SHA-256 to each preserved file. `graph.json` records literal links among those files. These edges establish reference relationships, not causality, empirical support or cross-medium equivalence.

`registry.json` is the smaller, curated executable/hypothesis layer. Add atomic entries only with explicit scope, measurement, implementation, limitations and fixtures. A sourced formula and an untested aesthetic preference are different kinds of knowledge. Do not copy a whole guide into the registry and label it validated.

Migration is incremental: color conversions and palette exploration, typography, composition, charts, native documents, interaction and project persistence remain represented in source knowledge. Only the four declared HTML constraint checks currently execute in GDC-0. Existing Dazzler implementations continue to own the other runtime behaviors until a separately tested migration occurs.
