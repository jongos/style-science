# A release is a reviewed snapshot

The portable distribution is the runtime, plan schema, examples and frozen
knowledge library listed in `distribution.json`. The list is a review boundary,
not a directory scan. Every entry is required. Knowledge data, source notices,
licenses and provenance travel together and their inventory hashes are checked.
Website assets, evaluation runs, tests, local configuration and unfinished
research are not implicitly part of this distribution.

After review and a separately authorized commit, build with a full lowercase
commit ID (40 hex characters for SHA-1 repositories, 64 for SHA-256):

```powershell
python tools/build_package.py --revision <full-commit-id> --output dist/reviewed-build
```

The builder reads both the manifest and every payload file from committed Git
blobs. Staged changes, modified files and untracked files are irrelevant to the
selected source. A working-copy manifest cannot expand the archive. Branches,
tags, abbreviated revisions, symlinks, missing entries and omitted runtime exports
fail clearly. There is no fallback to local files. The builder itself should be
reviewed at the same revision; these local corrections are not yet a release.
Local Git replacement refs are ignored so they cannot rewrite the declared source.

Archives contain `SOURCE.json` with the source commit, distribution-manifest hash
and per-file SHA-256 hashes. A sidecar adds the archive SHA-256. Sorted paths,
fixed timestamps and permissions, and uncompressed ZIP entries make identical
inputs byte-reproducible without depending on a compression-library version.
The builder compares two serializations before writing and refuses to overwrite
an existing artifact. Build into two fresh directories to compare independent
archive and sidecar hashes. ZIP size is intentionally larger than compressed ZIP.

`npm run test:packaging` checks membership, staged/untracked isolation, required
files and notices, provenance integrity, unsafe entries and repeat-build hashes
using synthetic temporary Git repositories, including independent-process builds.
It does not package active research.
The test suite only cleans up the temporary fixtures it created.

Verified locally on Windows: nine packaging cases pass, including byte/hash
equality across separate Python processes. Cross-operating-system reproducibility
has not yet been exercised. The pre-correction commit correctly fails for lack
of a committed manifest; no working-tree release archive was produced.

The initial manifest intentionally excludes the uncommitted language, relationship
and recipe research. The current working `package.json` advertises experimental
exports outside that manifest; committing those exports without an explicit
distribution decision will make packaging fail. Do not resolve this by scanning
directories or silently admitting all research. Review a bounded release change.

Manifest inclusion and a Git hash establish membership and source identity, not
human approval, license clearance for new imports, installation, or publication.
Existing imported provenance qualifications remain unchanged. This ZIP is not an
`npm pack` artifact or a full research/source archive.
