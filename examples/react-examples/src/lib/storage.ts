import { JsonSerializer } from "@useflow/core";
import { createPersister, kvStorageAdapter } from "@useflow/react";

// Global storage adapter for the application
export const storage = kvStorageAdapter({
  store: localStorage,
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

// Global persister with 7-day TTL
export const persister = createPersister({
  storage,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
});
