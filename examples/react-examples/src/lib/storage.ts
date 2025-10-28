import { JsonSerializer } from "@useflow/core";
import { createPersister, kvStorageAdapter } from "@useflow/react";

export const store = kvStorageAdapter({
  storage: localStorage,
  serializer: JsonSerializer,
  formatKey: (flowId, instanceId) =>
    instanceId ? `myapp:${flowId}:${instanceId}` : `myapp:${flowId}`,
  listKeys: (flowId) => {
    const allKeys = Object.keys(localStorage);
    if (!flowId) return allKeys;

    // Filter keys for this specific flow
    const baseKey = `myapp:${flowId}`;
    return allKeys.filter(
      (key) => key === baseKey || key.startsWith(`${baseKey}:`),
    );
  },
});

export const persister = createPersister({
  store,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
});
