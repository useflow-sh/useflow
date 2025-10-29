import { createLocalStorageStore, createPersister } from "@useflow/react";

// Simplified store creation - handles key formatting and enumeration automatically
export const store = createLocalStorageStore(localStorage, { prefix: "myapp" });

export const persister = createPersister({
  store,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
});
