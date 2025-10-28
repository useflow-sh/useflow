import { createPersister, kvJsonStorageAdapter } from "@useflow/react";

// Global storage adapter for the application
export const storage = kvJsonStorageAdapter({
  store: localStorage,
  prefix: "myapp",
});

// Global persister with 7-day TTL
export const persister = createPersister({
  storage,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
});
