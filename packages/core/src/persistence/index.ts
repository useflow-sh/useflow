/**
 * Persistence module
 *
 * This module provides everything needed to persist and restore flow state:
 * - State transformation utilities (extract, restore, validate)
 * - Persister interface and factory
 * - Storage interface
 * - Storage adapters
 * - Storage implementations
 * - Serializers
 */

// Storage adapters
export type { KVStorageAdapterOptions, KVStore } from "./kv-storage-adapter";
export { kvStorageAdapter } from "./kv-storage-adapter";
// Storage implementations
export { createMemoryStorage } from "./memory";
// Persister
export type { FlowPersister, PersisterOptions } from "./persister";
export { createPersister } from "./persister";
// Serializers
export type { Serializer, StringSerializer } from "./serializer";
export { JsonSerializer } from "./serializer";

// State utilities
export type { ValidationResult } from "./state";
export { validatePersistedState } from "./state";

// Storage
export type { FlowStorage, KVFlowStorage } from "./storage";
