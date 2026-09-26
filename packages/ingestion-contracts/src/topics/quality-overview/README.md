# Quality overview ingestion

The payload wraps the portable Verdr overview with the producing GitHub workflow
and an immutable report location. A workflow failure and passing test evidence
can coexist. Consumers must retain both and recompute each evidence row's age at
view time; the snapshot's cached freshness is an observation, not a permanent pass.

The generated schema comes from `z.toJSONSchema(overviewSchema, { target:
"draft-7" })` in [Verdr's overview model](https://github.com/Castrozan/verdr/blob/f1b68d04e8cfe44bb6b85e1046b61140d836bf06/src/overview/model.ts).
Draft 7 matches the existing ingestion schema validator. It changes the schema
dialect, not the evidence model. Verdr is MIT licensed. Regenerate this schema
from the pinned model when upgrading the evidence contract; do not edit its body.

Ajv validates structure and formats. The parser also rejects conflicting workflow
identity, report origin, counters and execution outcomes. The hosted wrapper owns
the GitHub and bucket bindings; those remain outside Verdr's portable core.
