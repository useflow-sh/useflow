import type { PersistedFlowState } from "../types";

/**
 * Generic serializer interface for converting flow state to/from any format
 *
 * @template T - The serialized data type (e.g., string, Uint8Array, Buffer)
 */
export interface Serializer<T> {
  /**
   * Serialize flow state
   * @param state - The flow state to serialize
   * @returns Serialized representation
   */
  serialize(state: PersistedFlowState): T;

  /**
   * Deserialize to flow state
   * Should return null if deserialization fails or data is invalid
   *
   * @param data - The serialized data
   * @returns Deserialized state, or null if deserialization fails
   */
  deserialize(data: T): PersistedFlowState | null;
}

/**
 * String serializer interface for converting flow state to/from strings
 *
 * This is the most common type of serializer, used with key-value stores
 * that store string values (localStorage, Redis, etc.).
 *
 * Common use cases:
 * - Compression (gzip, brotli)
 * - Encryption
 * - Custom encoding
 * - Alternative formats (YAML, TOML, etc.)
 */
export type StringSerializer = Serializer<string>;

/**
 * Built-in JSON serializer (default)
 *
 * Uses JSON.stringify/parse with validation to ensure the parsed data
 * has the correct structure for a PersistedFlowState.
 *
 * @example
 * ```ts
 * import { kvStorageAdapter, JsonSerializer } from '@useflow/react';
 *
 * const storage = kvStorageAdapter({
 *   store: localStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `app:${flowId}:${instanceId}` : `app:${flowId}`,
 *   serializer: JsonSerializer // Optional - this is the default
 * });
 * ```
 */
export const JsonSerializer: StringSerializer = {
  serialize(state: PersistedFlowState): string {
    return JSON.stringify(state);
  },

  deserialize(data: string): PersistedFlowState | null {
    try {
      const parsed = JSON.parse(data);

      // Basic structure validation
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof parsed.stepId !== "string" ||
        typeof parsed.context !== "object" ||
        parsed.context === null ||
        !Array.isArray(parsed.history) ||
        (parsed.status !== "active" && parsed.status !== "complete")
      ) {
        return null;
      }

      return parsed as PersistedFlowState;
    } catch {
      return null;
    }
  },
};
