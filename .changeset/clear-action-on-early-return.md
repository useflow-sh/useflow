---
"@useflow/react": patch
---

Clear the internal action state on early return paths in `save()` and the persistence effect when the persister is disabled or non-navigation modes are active, preventing action ref leaks.
