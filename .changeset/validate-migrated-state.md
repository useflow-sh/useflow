---
"@useflow/core": minor
---

Run the persister's `validate` on migrated state too. Previously a successful migration skipped `validate`; migrated progress that fails it is now discarded and reported as `validation_rejected`.
