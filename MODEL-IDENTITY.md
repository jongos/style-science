# Model Identity and Migration

Decision 0.3.0 introduces a versioned provider policy, not a model authenticator.
New contracts set `identityPolicy: "1.0.0"`; their fingerprint includes the
canonical policy SHA-256. Observations preserve `provider`, `requestedModel`
and `resolvedModel` separately. Mixed providers or resolutions cannot qualify.

The initial policy retains the existing TypeSafe release pattern and adds two
explicit reviewed snapshots: OpenAI `gpt-4o-2024-08-06` and Anthropic
`claude-sonnet-4-5-20250929`. Sources: [OpenAI snapshots](https://developers.openai.com/api/docs/models/gpt-4o)
and [Anthropic versioning](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions).
This is not a complete catalog, model recommendation or availability guarantee.
New families require policy review rather than accepting arbitrary dated strings.

Aliases, unknown providers and bare digests remain unpinned. A digest without a
defined object does not identify a provider model. Pattern acceptance cannot prove
that a provider actually returned the claimed identity; the host retains the
response and its provenance. Agreement is never evidence of aesthetic quality.

Legacy contracts without `identityPolicy` retain their existing fingerprint
format and implicit TypeSafe scope. Valid Jev snapshots remain eligible under
the legacy rule, but bare digests no longer do. New policy-bound contracts must
be deliberately restamped; do not relabel historical observations as new evidence.
Unicode scalar sorting also corrects the prior JS/Python disagreement for astral
keys. Preserve raw observations and recalculate affected contract bindings only
when their original input is available.
