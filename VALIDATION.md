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

Existing `test:browser`, `test:site` and `test:downstream` commands are retained as
explicit optional browser-backed checks; they are not part of required CI and
were not run for this workflow correction. Do not run them as a workaround for
the instruction not to install or use Chromium. Historical saved browser
evidence is checked for integrity by the core suite, not regenerated.

Static checks do not establish font loading, responsive geometry, overflow,
focus behavior, keyboard interaction, rendered contrast, screenshot correctness
or browser accessibility. Those behaviors remain untested by this validation
path, not passed or silently waived. Remote links are not fetched, and HTML
parsing is not full standards validation.

The former `browser` CI job is removed, not renamed to report a browser pass.
If repository rules require that exact job name, an administrator must separately
authorize updating those rules; this change does not alter branch protections.
Publication and deployment workflows are unchanged.
