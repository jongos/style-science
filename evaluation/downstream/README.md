# Publishing Synthetic Comparison Reports

The frozen [protocol](PROTOCOL.md) and recorded source hashes describe the original run. Privacy cleanup is metadata redaction, not a rerun or a new result.

Before checking in a generated report, export `evidenceDirectory` relative to the repository root (for example, `dist/downstream-<run-id>/`). The local runner may emit an absolute working location; do not publish its machine-specific prefix. Preserve all observations, timings and recorded source hashes. The report regression check rejects absolute evidence locations.

A relative reference does not imply that ignored evidence is distributed. Do not add private briefs, local account details or screenshots of unrelated applications when packaging evidence.
