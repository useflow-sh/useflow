import { useState } from "react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { taskFlow } from "../flow";

export function DetailsStep() {
  const { context, next, back } = taskFlow.useFlow({
    step: "details",
  });

  const [title, setTitle] = useState(context.title || "");
  const [description, setDescription] = useState(context.description || "");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setDescription(value);
  };

  const canProceed = title.trim() !== "" && description.trim() !== "";

  return (
    <StepCard
      title="Task Details"
      description={`Provide information about this ${context.taskType}`}
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => next({ title, description })}
            disabled={!canProceed}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Brief summary of the task"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Detailed description..."
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </StepCard>
  );
}
