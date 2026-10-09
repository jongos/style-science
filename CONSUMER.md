# Upgrade by capability, not by directory

The `gdc-core` profile exposes consumer contract 1.0.0, plan schema 1 and the
existing core, decision and canvas modules. Minimum runtimes remain Node 22 and
Python 3.10. Renderer libraries stay host-provided. Research APIs are not declared
stable simply because their files exist locally.

1. Preserve the host's previous pinned directory, manifest and native delivery gates.
2. Obtain the reviewed archive and its sidecar through a trusted release channel.
   Verify the archive SHA-256 before extracting to a new directory.
3. Load `inspectDistribution(directory, trustedSidecar)` or Python
   `inspect_distribution`. It verifies committed payload hashes and source identity.
4. Call `negotiate` with `contractVersion: "1.0.0"`, `planSchema: 1`, `modules`
   and `checks`. Supported means the instrument exists, not that an output passes.
   Unknown names remain unknown; absent optional modules are unsupported.
5. Switch the host's pin only after its own fixture and native-medium tests pass.
   On any failure, keep the previous pin. Rollback means restoring that pin,
   not deleting the backup or rewriting the research workspace.

For example, a Dazzler upgrade may request `core` and `decision` plus
`viewport-overflow` and `model-choice`. Requesting `word-pagination` returns
unsupported. A future check not known to this contract returns unknown. Neither
result can waive Word, slide, accessibility or design review gates.

Breaking contract/schema changes require a new major version and explicit host
migration. Additive optional modules require review and manifest changes. Patch
corrections can alter previously invalid inputs; decision 0.3.0 rejects numeric
abstention IDs and unpaired surrogates. Astral-key fingerprints now use Unicode
code-point order; regenerate affected contract stamps, not recorded judgments.

Decision 0.3.0 also introduces provider-qualified identity policy contracts and
rejects bare model digests. See MODEL-IDENTITY.md before changing evidence pins.

The artifact verifier is not a signature service: a sidecar copied from an
untrusted archive is not a trust anchor. No installation or Dazzler update occurs
when these functions run.
