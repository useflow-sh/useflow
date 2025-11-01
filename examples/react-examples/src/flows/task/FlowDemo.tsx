import { Flow } from "@useflow/react";
import { ArrowLeft, ChevronDown, ListTodo, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimateFlowStep } from "../../components/AnimateFlowStep";
import { FlowInspector } from "../../components/FlowInspector";
import { LoadingView } from "../../components/LoadingView";
import { persister, store } from "../../lib/storage";
import { AssignStep } from "./components/AssignStep";
import { DetailsStep } from "./components/DetailsStep";
import { ReviewStep } from "./components/ReviewStep";
import { TaskCompleteStep } from "./components/TaskCompleteStep";
import { TaskTypeStep } from "./components/TaskTypeStep";
import { type TaskFlowContext, taskFlow } from "./flow";

type Task = {
  id: string;
  title: string;
  type: string;
  description?: string;
  assignee?: string;
  priority?: string;
  createdAt: number;
};

type DraftTask = {
  id: string | undefined;
  stepId: string;
  context: TaskFlowContext;
};

export function TaskFlowDemo() {
  const [activeTaskId, setActiveTaskId] = useState<string | undefined | null>(
    null,
  );
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([]);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  // Load draft tasks and completed tasks from store on mount
  useEffect(() => {
    const loadTasks = async () => {
      // Load draft tasks from flow store
      const instances = await store.list(taskFlow.id);

      if (instances) {
        // Filter for active (incomplete) flows only
        const drafts: DraftTask[] = instances
          .filter((instance) => instance.state.status === "active")
          .map((instance) => ({
            id: instance.instanceId,
            stepId: instance.state.stepId,
            context: instance.state.context as TaskFlowContext,
          }));

        setDraftTasks(drafts);
      }

      // Load completed tasks from localStorage
      const savedTasks = localStorage.getItem("completed-tasks");
      if (savedTasks) {
        try {
          const tasks = JSON.parse(savedTasks);
          setCompletedTasks(tasks);
        } catch (error) {
          console.error("Failed to load completed tasks:", error);
        }
      }
    };

    loadTasks();
  }, []);

  const handleStartNewTask = () => {
    const taskId = `task-${Date.now()}`;
    setActiveTaskId(taskId);
  };

  const saveTask = (context: TaskFlowContext) => {
    if (!activeTaskId) return;
    const newTask: Task = {
      id: activeTaskId,
      title: context.title,
      type: context.taskType || "unknown",
      description: context.description,
      assignee: context.assignee,
      priority: context.priority,
      createdAt: context.createdAt || Date.now(),
    };
    setCompletedTasks((prev) => {
      const updated = [...prev, newTask];
      // Persist to localStorage
      localStorage.setItem("completed-tasks", JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateAnother = (context: TaskFlowContext) => {
    saveTask(context);
    if (activeTaskId) {
      persister.remove?.(taskFlow.id, { instanceId: activeTaskId });
      // Remove from draft tasks
      setDraftTasks((prev) => prev.filter((t) => t.id !== activeTaskId));
    }
    setActiveTaskId(null);
    handleStartNewTask();
  };

  const handleViewAll = (context: TaskFlowContext) => {
    saveTask(context);
    if (activeTaskId) {
      persister.remove?.(taskFlow.id, { instanceId: activeTaskId });
      // Remove from draft tasks
      setDraftTasks((prev) => prev.filter((t) => t.id !== activeTaskId));
    }
    setActiveTaskId(null);
  };

  const handleResumeDraft = (taskId: string | undefined) => {
    setActiveTaskId(taskId);
  };

  const handleDeleteDraft = async (taskId: string | undefined) => {
    await persister.remove?.(taskFlow.id, { instanceId: taskId });
    setDraftTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleClearCompleted = () => {
    setCompletedTasks([]);
    localStorage.removeItem("completed-tasks");
  };

  const handleCancelTask = () => {
    if (activeTaskId) {
      persister.remove?.(taskFlow.id, { instanceId: activeTaskId });
      // Remove from draft tasks
      setDraftTasks((prev) => prev.filter((t) => t.id !== activeTaskId));
    }
    setActiveTaskId(null);
    handleStartNewTask();
  };

  const handleTransition = ({
    newContext,
    to,
  }: {
    from: string;
    to: string;
    oldContext: unknown;
    newContext: unknown;
  }) => {
    // Update draft task in the list as user progresses
    if (activeTaskId) {
      setDraftTasks((prev) => {
        const existing = prev.find((t) => t.id === activeTaskId);
        const context = newContext as TaskFlowContext;
        if (existing) {
          return prev.map((t) =>
            t.id === activeTaskId ? { ...t, stepId: to, context } : t,
          );
        }
        // Add new draft if not exists
        return [...prev, { id: activeTaskId, stepId: to, context }];
      });
    }
  };

  if (!activeTaskId) {
    return (
      <div className="min-h-screen flex flex-col p-4">
        <Card className="w-full max-w-2xl mx-auto border-0 flex flex-col max-h-screen">
          {/* Fixed Header */}
          <CardHeader className="text-center flex-shrink-0">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ListTodo className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Task Manager</CardTitle>
            <CardDescription className="text-base">
              Create and manage tasks with reusable flow instances
            </CardDescription>
          </CardHeader>

          {/* Create Button - Fixed at top */}
          <CardContent className="flex-shrink-0 pb-4">
            <Button onClick={handleStartNewTask} className="w-full" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create New Task
            </Button>
          </CardContent>

          {/* Scrollable Content */}
          <CardContent className="flex-1 overflow-y-auto space-y-6 pt-0">
            {draftTasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold sticky top-0 bg-background py-2 z-10">
                  Draft Tasks ({draftTasks.length})
                </h3>
                <div className="space-y-2">
                  {draftTasks.map((draft) => (
                    <div
                      key={draft.id ?? "base"}
                      className="flex items-center justify-between p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/20"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {draft.context.title || "Untitled Task"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {draft.context.taskType || "No type"} • On step:{" "}
                          {draft.stepId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResumeDraft(draft.id)}
                        >
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDraft(draft.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between sticky top-0 bg-background py-2 z-10">
                  <h3 className="text-sm font-semibold">
                    Created Tasks ({completedTasks.length})
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearCompleted}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-2">
                  {completedTasks.map((task) => {
                    const isExpanded = expandedTaskIds.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className="rounded-lg border bg-muted/30 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedTaskIds((prev) => {
                              const next = new Set(prev);
                              if (isExpanded) {
                                next.delete(task.id);
                              } else {
                                next.add(task.id);
                              }
                              return next;
                            })
                          }
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {task.type} •{" "}
                              {new Date(task.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                              isExpanded ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                        </button>

                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isExpanded
                              ? "max-h-96 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="px-3 pb-3 pt-0 space-y-2 bg-muted/10">
                            {task.description && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  Description
                                </p>
                                <p className="text-sm">{task.description}</p>
                              </div>
                            )}
                            {task.priority && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  Priority
                                </p>
                                <p className="text-sm capitalize">
                                  {task.priority}
                                </p>
                              </div>
                            )}
                            {task.assignee && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  Assignee
                                </p>
                                <p className="text-sm">{task.assignee}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                Created
                              </p>
                              <p className="text-sm">
                                {new Date(task.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {completedTasks.length === 0 && draftTasks.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No tasks yet. Create your first task to see how reusable flow
                instances work!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Flow
      key={activeTaskId}
      flow={taskFlow}
      instanceId={activeTaskId}
      initialContext={{
        title: "",
        description: "",
      }}
      onTransition={handleTransition}
      persister={persister}
      saveMode="always"
      loadingComponent={<LoadingView />}
    >
      {({ renderStep, context }) => (
        <>
          {/* Back to Task Manager Button */}
          <div className="fixed top-4 left-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelTask}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Task Manager
            </Button>
          </div>

          <FlowInspector
            flowId={taskFlow.id}
            store={store}
            instanceId={activeTaskId}
            position="right"
          />

          {/* Main content - centered in viewport */}
          <div className="flex items-center justify-center min-h-screen">
            <AnimateFlowStep>
              {renderStep({
                taskType: <TaskTypeStep />,
                details: <DetailsStep />,
                assign: <AssignStep />,
                review: <ReviewStep />,
                complete: (
                  <TaskCompleteStep
                    title={context.title}
                    taskType={context.taskType}
                    onCreateAnother={() =>
                      handleCreateAnother(context as TaskFlowContext)
                    }
                    onViewAll={() => handleViewAll(context as TaskFlowContext)}
                  />
                ),
              })}
            </AnimateFlowStep>
          </div>
        </>
      )}
    </Flow>
  );
}
