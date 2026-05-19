"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { priorityLabels, statusLabels } from "@/lib/constants";
import { Priority, Task, TaskStatus, User } from "@/types";

const schema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  dueDate: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in-progress", "done"]),
  assignedTo: z.string().min(1)
});

export type TaskFormValues = z.infer<typeof schema>;

function dateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function TaskForm({
  members,
  task,
  onSubmit,
  submitLabel
}: {
  members: User[];
  task?: Task;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: dateInput(task?.dueDate),
      priority: task?.priority || "medium",
      status: task?.status || "todo",
      assignedTo: task?.assignedTo?._id || members[0]?._id || ""
    }
  });

  const submit = (values: TaskFormValues) =>
    onSubmit({
      ...values,
      dueDate: new Date(`${values.dueDate}T12:00:00.000Z`).toISOString()
    });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input id="task-title" {...register("title")} />
        {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea id="task-description" {...register("description")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={field.value} onValueChange={(value) => field.onChange(value as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        />
        <Controller
          control={control}
          name="assignedTo"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Assigned user</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {members.map((member) => <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>
      <Button className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
