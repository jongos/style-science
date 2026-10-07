# Evaluate behavior and implicit loading

Use `scripts/evaluate.py` for artifact assertions with an authorized real host runner. Use `scripts/triggering.py --host HOST --out NEW_DIRECTORY --command-file argv.json` to compare the saved baseline description with the current one across 20 unnamed positive prompts and 10 near-miss negatives.

The command file is a JSON argv array, never a shell expression. It may contain `{request_file}` and `{output_dir}` placeholders. Each request contains a prompt, candidate skill name/description and the required observation path. The adapter must start a fresh real host session, expose that candidate through the host's normal discovery mechanism, submit only the unnamed prompt, and record whether the host actually loaded it. Do not force invocation or show expected results to the model.

Write `observation.json` with `loaded` as a boolean and `evidence` as a nonempty description or trace identifier from the actual host. Missing evidence, adapter failures and timeouts are not passes. No adapter means all 60 baseline/current observations are `not-run`. Review adapter provenance before trusting results; the harness cannot independently authenticate a host trace. Record the host/model/version and permissions in the host label or accompanying private run notes.

The suite is repeatable coverage, not proof of routing quality until executed against each target host. Unit-test adapters are only harness fixtures. Keep transcripts and user material private unless publication is authorized.

Reports include precision, recall, false positives, false negatives and unrun counts. Undefined precision/recall is `null`, not zero or a pass. The original suite and its saved baseline remain unchanged; starter examples are training/onboarding material, not held-out evaluation prompts.

Maintainers can use `tools/evaluate_codex.py` from the source checkout for fresh CLI sessions. Disable any existing Dazzler catalog entry with `--disable-skill-path` to avoid duplicate discovery, and inspect the native prompt catalog before relying on comparisons. Successful file-read traces establish loading; self-reported use does not. Policy-blocked tool access and timeouts count as unrun. Keep raw traces local and review a redacted report before publication. The adapter records CLI version and settings; if the resolved default model is unavailable, it says so rather than inventing one. Single runs are stochastic observations, not evidence of a quality improvement.
## Design Principles Review

Use `evals/design-principles.json` for six realistic briefs covering tone, measure, hierarchy, casing overrides, danger controls, private fonts and data integrity. These are review fixtures, not claimed real-host successes. Record the resulting artifacts and observed behavior before assigning outcomes.

## Editorial and Design Conflicts

Use `evals/editorial-cases.json` to review design-first choices, protected facts, visual-only scope, technical terms, critique-only requests, truthful controls, required summaries and author voice. Record actual host outputs before claiming success; package checks only establish that the guidance and notices ship together.
