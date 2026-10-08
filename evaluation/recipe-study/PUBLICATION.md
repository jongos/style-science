# Published recipe source

This source publication addresses Style Science #20 and supplies the immutable
upstream input needed for Dazzler #41. It preserves the original study, retained
winner records and six guides byte-for-byte. It does not rerun Jev, recover rejected
records, change selection thresholds or upgrade model opinion to aesthetic evidence.

`source-manifest.json` records the ten source-file hashes previously recorded by
Dazzler 0.28.x. In particular, the dataset revision remains
`sha256:686eb8f4a8bb2457b43add204e89d9fc0c017eb7f49c494aaa5cdd71fac4f567`.
The commit containing these files is the new source revision; the old `fa26b16`
reference cannot identify these previously uncommitted files. Historical releases
remain historical and must not be described as having had public source at shipment.

## Re-import

Use a clean checkout of this publication commit, not the active research working
tree. Dazzler's importer reads committed blobs and rejects a dirty checkout. Build
into a new temporary destination, compare `index.json` and all 1,000 detail files
with the existing import, and only then migrate the provenance deliberately.
Record the full source commit and verify it is reachable from the public remote.
Do not merely change `sourceWorkingTreeModified` to false by hand.

The project owner confirmed permission to use the retained TypeSafe evidence on
October 7, 2026. This is customer-confirmed permission, not independent verification
of contractual rights. Apache-2.0 covers the project's original material; it does
not itself establish rights to third-party material. Consumers should preserve
this qualification alongside model identities, hashes and study limitations.

## Boundaries

The source publication does not refresh Dazzler's gallery evidence, change its
installed skill, publish a new Dazzler release, or bypass its release gates. The
separate runtime/gallery mismatch still requires the prescribed generation and
visual review workflow. URL references are clues, not inspected website evidence.
No browser is installed and no provider calls are required to verify this source.

## Local verification

Before publication, the isolated staged-only checkout passed all 38 tests in its
normal non-browser suite, including packaging, JavaScript/Python parity and eight
recipe regressions. The manifest test reproduced all ten historical input hashes.
The active research tree was not used as the release source. Browser-only behavior
was not tested; these checks do not certify aesthetic quality or remote CI status.
