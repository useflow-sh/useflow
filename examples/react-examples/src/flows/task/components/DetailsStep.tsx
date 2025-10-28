import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { taskFlow } from "../flow";

export function DetailsStep() {
  const { context, next, back, setContext } = taskFlow.useFlow({
    step: "details",
  });

  const [title, setTitle] = useState(context.title || "");
  const [description, setDescription] = useState(context.description || "");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    setContext({ title: value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setDescription(value);
    setContext({ description: value });
  };

  const canProceed = title.trim() !== "" && description.trim() !== "";

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Task Details</CardTitle>
        <CardDescription>
          Provide information about this {context.taskType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => next()}
          disabled={!canProceed}
          className="flex-1"
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}
