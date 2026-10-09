# Validation without a browser

Required conformance CI runs the JavaScript/Python core, parity, provenance and
committed-source packaging tests. The separate `site-static` job builds the site,
checks JavaScript syntax and verifies generated content, local HTML references,
asset existence, anchors and basic structural declarations with Python's standard
library. Neither job installs or launches a browser.

Local equivalents:

```shell
npm test
python tools/build_knowledge_graph.py
git diff --exit-code knowledge/graph.json
node tools/build_site.mjs
node --check site/app.js
python tools/test_site_static.py
```

`test:browser` and `test:site` are optional rendered checks using host-provided
Playwright and an existing browser. Set `PLAYWRIGHT_EXECUTABLE_PATH` to its
executable; no browser installation is performed by these commands. The adapter
uses `GDC_PLAYWRIGHT_MODULE`; the site uses `PLAYWRIGHT_MODULE` and `AXE_SCRIPT`.
They are separate from required non-browser CI. A skipped rendered check is not
a pass. The optional host-rendered workflow fails clearly if its host lacks Chrome.

`npm run test:research` validates local experimental modules separately from the
release core. `test:research:browser` exercises their renderer instruments;
`test:downstream` runs a synthetic comparison, not a production Dazzler benchmark.
These source-checkout commands do not imply inclusion in the release ZIP.

For research collectors that use the Playwright facade, set
`GDC_PLAYWRIGHT_MODULE` to the file URL of `tools/host-playwright.mjs`,
`PLAYWRIGHT_MODULE` to the host's existing Playwright module, and
`PLAYWRIGHT_EXECUTABLE_PATH` to existing Chrome. This preserves historical
collector sources and evidence hashes while selecting the installed browser.

Validation counts belong to a named revision and command, not a permanent feature
claim. Historical working-tree totals in the changelog included experimental
modules that were not committed with the core. They are not reproducible totals
for those published revisions. Use current command output for current counts.

Static checks do not establish font loading, responsive geometry, overflow,
focus behavior, keyboard interaction, rendered contrast, screenshot correctness
or browser accessibility. Those behaviors remain untested by this validation
path, not passed or silently waived. Remote links are not fetched, and HTML
parsing is not full standards validation.

The former `browser` CI job is removed, not renamed to report a browser pass.
If repository rules require that exact job name, an administrator must separately
authorize updating those rules; this change does not alter branch protections.
Publication and deployment workflows are unchanged.
