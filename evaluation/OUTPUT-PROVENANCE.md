# Recorded model evidence

The project owner confirmed permission to use the retained TypeSafe evidence on
2026-10-07 as a paying customer. This is customer-confirmed authorization, not an
independent legal verification. It is not a claim that repository licensing alone
grants rights to provider material. Public reference pages are
[TypeSafe's agreement](https://typesafe.ai/legal/mca) and
[site terms](https://typesafe.ai/legal/terms); the customer's permission is the
working authorization for this project.

`capture-provenance.json` hashes the seven historical batch/response pairs and
the smoke response. Request pairing is reconstructed from existing filenames,
not a provider attestation. Original responses retain model, request ID, usage
and provider evaluation time where recorded. Exact capture timestamps were not
recorded and remain null. A timestamp on this inventory is not a capture time.

Run `node tools/capture-provenance.mjs` to reproduce the inventory. No response is
rewritten, no rejected recipe is recovered, and no network call occurs. The
separate winner-only study retains its original provenance and protocols.
Model judgments are not human assessments or ground truth about design quality.
