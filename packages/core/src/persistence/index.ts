/**
 * Persistence module
 *
 * This module provides everything needed to persist and restore flow state:
 * - State transformation utilities (extract, restore, validate, serialize)
 * - Persister interface and factory
 * - Storage interface
 * - Storage adapters
 * - Storage implementations
 */

// Storage adapters
export {
  type KVJSONStorageAdapterOptions,
  kvJsonStorageAdapter,
} from "./kv-json-storage-adapter";
// Storage implementations
export { createMemoryStorage } from "./memory";
// Persister
export type { FlowPersister, PersisterOptions } from "./persister";
export { createPersister } from "./persister";
// State utilities
export type { ValidationResult } from "./state";
export {
  deserializeFlowState,
  serializeFlowState,
  validatePersistedState,
} from "./state";
// Storage
export type { FlowStorage, KVFlowStorage } from "./storage";
