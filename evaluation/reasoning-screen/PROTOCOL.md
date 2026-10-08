# Ten-pair reasoning-format screen

Frozen before Jev submission on October 8, 2026. Original synthetic inputs only.

Question: does structured serialization improve Jev's correctness on scoped
decision evidence compared with a flat list of exactly the same leaf facts?
This is a serialization screen, not yet a comparison of complete reasoning engines.

Ten cases, two calls of ten choice questions: structured first, flat second.
Each call has only one representation. Case-specific inputs and the same rubric
are supplied to both. Exact dot-path flattening retains every leaf, including
nulls and empty arrays. No answer key is sent. Labels rotate by case equally in
both arms. Fixed block order and one judgment per arm are confounds: results are
exploratory, not order-robust causal evidence or release-eligible decisions.

Oracle: an explicit failed hard check yields fail even if another check is
unknown. Otherwise absent, conflicting, wrong-context, old-artifact or old-rule
evidence yields unknown. Pass requires at least one required check and every
required check to pass with matching artifact, rule and context. Preference
scores and unrelated changes cannot override these rules. A check on derived
data is stale when its declared dependency revision differs from the current one.

Cases: artifact revision, context, failed constraint, rule revision, missing
evidence, valid evidence, irrelevant change, preference versus constraint,
contradictory observations and dependency revision.

Scoring: decode the top-probability choice; a tied maximum or absent/malformed
response is unknown/unscorable, not a win. A case-level winner is a correct arm
paired with an incorrect arm. Both-correct and both-wrong cases are non-winners.
Only winner payloads and judgments are retained. Aggregate counts, timing,
requested/resolved model identities, request IDs and request/response hashes are
retained for honest accounting, without loser payloads. Test specifications are
the fixed measurement instrument, not losing feature proposals.

Measure submission-to-visible-response wall time per batch separately from
provider evaluation time, local preparation time and overall elapsed work. Do
not claim UI latency is model inference latency or infer cost from rounded balance.
Capture usage/cost when returned; otherwise mark unknown.

Only a demonstrated improvement may enter optional research behavior; this small
screen cannot change hard gates or establish human benefit/aesthetic quality.
If neither format wins, incorporate neither as a new improvement. Do not rerun
until a winner appears. No new variants beyond the ten pairs in this pass.
