import { defineFlow } from "@useflow/react";

/**
 * Task Flow - Demonstrates Reusable Flow Instances
 *
 * This flow showcases useFlow's instanceId feature, which allows you to:
 * - Create multiple independent instances of the same flow
 * - Each instance maintains its own separate state
 * - Perfect for forms that can be created multiple times (tasks, tickets, orders)
 *
 * Key Concept:
 * When you provide an `instanceId` prop to the Flow component, it creates
 * a separate state for that instance. This means you can have multiple
 * task creation flows running simultaneously without conflicts.
 *
 * Storage Keys:
 * - Without instanceId: "myapp:task-flow"
 * - With instanceId:    "myapp:task-flow:task-1", "myapp:task-flow:task-2", etc.
 *
 * Use Case:
 * Imagine a project management app where users can create multiple tasks.
 * Each task goes through the same flow (type → details → assign → review),
 * but each one needs independent state.
 */

export type TaskFlowContext = {
  taskType?: "bug" | "feature" | "improvement";
  title: string;
  description: string;
  priority?: "low" | "medium" | "high";
  assignee?: string;
  createdAt?: number;
};

export const taskFlow = defineFlow({
  id: "task-flow",
  start: "taskType",
  steps: {
    taskType: {
      next: "details",
    },
    details: {
      next: "assign",
    },
    assign: {
      next: "review",
    },
    review: {
      next: "complete",
    },
    complete: {
      // Terminal step
    },
  },
} as const);
