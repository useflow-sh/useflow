/**
 * Persistence module
 *
 * This module provides everything needed to persist and restore flow state:
 * - State transformation utilities (extract, restore, validate)
 * - Persister interface and factory
 * - Store interface
 * - Store adapters
 * - Store implementations
 * - Serializers
 */

// Persister
export type { FlowPersister, PersisterOptions } from "./persister";
export { createPersister } from "./persister";
// Serializers
export type { Serializer, StringSerializer } from "./serializer";
export { JsonSerializer } from "./serializer";
// State utilities
export type { ValidationResult } from "./state";
export { validatePersistedState } from "./state";
// Store
export type { FlowStore, KVFlowStore } from "./store";
// Store adapters and implementations
export type {
  KVStorageAdapterOptions,
  KVStore,
} from "./stores/kv-storage-adapter";
export { kvStorageAdapter } from "./stores/kv-storage-adapter";
export { createMemoryStore } from "./stores/memory";
