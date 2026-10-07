# Source and adaptation

This file contains attribution and licensing notes accompanying Dazzler.

## Notes and credits

Focused amplification, 2026-10-06 (0.25.1): the MCP Market Design Boldness & Impact listing linked an unavailable fork. Reviewed and adapted only `skill/reference/bolder.md` from Paul Bakaus's primary Impeccable project at `2a26f1c50b9c4f86d10c0fec8f74cf523a2236e7`, under Apache-2.0. Dazzler's existing rules take precedence; the adaptation adds document context, keeps automatic decisions and introduces no runtime dependency. `references/bolder-provenance.json` records source hashes; `references/bolder-LICENSE.txt` retains the license.

Editorial integration, 2026-10-06 (0.25.0): adapted Peter Yang's `no-ai-slop` SKILL.md and eval.md at `000650b156983f5159695b441477f4e63b25dc85`. Copyright 2026 Peter Yang; the MIT notice is retained unchanged in `references/editorial-LICENSE.txt`. The adaptation adds design-first precedence, protected content, scoped editing and Dazzler heading/layout checks. Blanket vocabulary/format bans, fixed punctuation quotas, mandatory questions and standalone response formatting were not imported. Source hashes and destinations are recorded in `references/editorial-provenance.json`. No upstream executable or runtime dependency is included.

Source: https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/skills/creative-design/frontend-design

Inspected on 2026-09-28 from the main branch. The source directory contained SKILL.md and LICENSE.txt only. No executable dependencies, bundled assets, linked helper scripts, or mandatory Claude tools were declared. The typography book mentioned in the source is guidance, not a runtime dependency. The surrounding repository's CLI installer is not required for this standalone skill.

The upstream Apache 2.0 LICENSE.txt is included unchanged. The adapted SKILL.md carries a modification notice. This is a local adaptation, not an official Anthropic or OpenAI product.

Changes: restructured design guidance; removed the assumed client history and mandatory confirmation step; preserved explicit brand and stack choices; added optional routing to existing Sites, visualization, image-generation, and browser capabilities; added implementation and verification boundaries. No external tool dependency is declared in agents/openai.yaml because the skill can guide design without one.

OpenAI skill format reference: https://developers.openai.com/plugins/build/skills

Automatic orchestration, 2026-09-28 (0.5.0): original guidance connects the existing font helper, bundled color engine, deslop reasoning and interface audit into one default agent-driven workflow. Users provide a task rather than tool configuration. Optional questions/selectors are activated only by requests for control or by genuine unresolved hard requirements. No dependency, font binary, palette catalog or upstream algorithm was changed; third-party credits and notices remain intact.

Design-framework expansion, 2026-09-28 (0.4.0): adapted only Samuel Berthe's (samber) `skills/frontend-design-deslop` folder from `samber/cc-skills` at f866b800353719270a9ea101a41c5e2a2618d460, upstream version 1.2.2. The MIT notice is retained in references/deslop-LICENSE.txt. references/deslop-provenance.json records source hashes, adapted destinations and excluded presets. The entrypoint routes to four consolidated framework guides and reuses the existing typography/color implementation. No wider-repository functionality or runtime dependency is introduced. evals/deslop-cases.json adapts behavioral scenarios to preserve brand locks, scope and honest validation instead of enforcing upstream style bans.

The folder is intended for this local ChatGPT/Codex environment's personal skills directory. The ZIP is a portable copy, not evidence of installation in other ChatGPT accounts or cloud environments.

Typography expansion, 2026-09-28: the original dependency audit above describes the source skill, not this expanded package. Version 0.2.0 adds a catalog of 25 Open Foundry families, 24 bundled families under their individual terms, and an optional standard-library Python selection/export helper. Consult references/font-catalog.md and each assets/fonts/*/SOURCE.md for attribution and licensing; font assets are not covered by the skill's Apache license.

Color expansion, 2026-09-28 (0.3.0): imported 88 palette entries from hue3 at a306210b7240e183366998ce39fbe7543cc09b41, retaining MIT attribution. Its theory instructions were not copied. The offline JavaScript engine bundles the published @ankhorage/color-theory 0.3.1 and Culori 4.0.2 packages with MIT notices; exact npm tarball integrity is pinned in the repository lockfile and bundle SHA-256 is in scripts/vendor/provenance.json. Our adapter adds semantic role constraints, locked-color preservation, failure reporting and portable preview/export. bivex/brand-color-palette-generator at 34120ac72e8153dd26ce2f995dba277477c74ce6 informed interaction ideas only; no code was copied and Colormind is not used. See references/color-workflow.md for source links, limitations and standards.
