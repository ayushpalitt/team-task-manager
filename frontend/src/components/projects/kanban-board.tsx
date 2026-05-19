"use client";

import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { priorityLabels, priorityStyles, statusLabels } from "@/lib/constants";
import { formatDate, initials } from "@/lib/utils";
import { Project, Task, TaskStatus } from "@/types";
import { TaskForm, TaskFormValues } from "./task-form";

const statuses: TaskStatus[] = ["todo", "in-progress", "done"];

export function KanbanBoard({
  tasks,
  project,
  currentUserId,
  onStatusChange,
  onUpdateTask,
  onDeleteTask
}: {
  tasks: Task[];
  project: Project;
  currentUserId: string;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onUpdateTask: (task: Task, values: TaskFormValues) => Promise<void>;
  onDeleteTask: (task: Task) => Promise<void>;
}) {
  const isAdmin = project.admin._id === currentUserId;

  const onDragEnd = async (event: DragEndEvent) => {
    const taskId = String(event.active.id);
    const status = event.over?.id as TaskStatus | undefined;
    const task = tasks.find((item) => item._id === taskId);
    if (!task || !status || task.status === status) return;
    if (!isAdmin && task.assignedTo._id !== currentUserId) return;
    await onStatusChange(task, status);
  };

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-3">
        {statuses.map((status) => (
          <KanbanColumn key={status} status={status} tasks={tasks} project={project} currentUserId={currentUserId} isAdmin={isAdmin} onStatusChange={onStatusChange} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  tasks,
  project,
  currentUserId,
  isAdmin,
  onUpdateTask,
  onDeleteTask,
  onStatusChange
}: {
  status: TaskStatus;
  tasks: Task[];
  project: Project;
  currentUserId: string;
  isAdmin: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onUpdateTask: (task: Task, values: TaskFormValues) => Promise<void>;
  onDeleteTask: (task: Task) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const columnTasks = tasks.filter((task) => task.status === status);

  return (
    <div ref={setNodeRef} className={`rounded-lg border bg-secondary/40 p-3 ${isOver ? "ring-2 ring-primary" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{statusLabels[status]}</h2>
              <Badge variant="secondary">{columnTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskCard key={task._id} task={task} project={project} currentUserId={currentUserId} isAdmin={isAdmin} onStatusChange={onStatusChange} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
              ))}
              {!columnTasks.length ? <div className="rounded-md border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">No tasks</div> : null}
            </div>
          </div>
  );
}

function TaskCard({
  task,
  project,
  currentUserId,
  isAdmin,
  onStatusChange,
  onUpdateTask,
  onDeleteTask
}: {
  task: Task;
  project: Project;
  currentUserId: string;
  isAdmin: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onUpdateTask: (task: Task, values: TaskFormValues) => Promise<void>;
  onDeleteTask: (task: Task) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const style = { transform: CSS.Translate.toString(transform) };
  const canUpdateStatus = isAdmin || task.assignedTo._id === currentUserId;

  return (
    <Card ref={setNodeRef} style={style} className={`p-4 ${isDragging ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <button className="min-w-0 flex-1 cursor-grab text-left active:cursor-grabbing" {...listeners} {...attributes}>
          <h3 className="font-medium">{task.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description || "No description"}</p>
        </button>
        <div className="flex shrink-0 gap-1">
          {isAdmin ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Edit task"><Pencil className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit task</DialogTitle></DialogHeader>
                <TaskForm members={project.members} task={task} submitLabel="Save task" onSubmit={(values) => onUpdateTask(task, values)} />
              </DialogContent>
            </Dialog>
          ) : null}
          {isAdmin ? (
            <Button variant="ghost" size="icon" aria-label="Delete task" onClick={() => onDeleteTask(task)}><Trash2 className="h-4 w-4" /></Button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant={priorityStyles[task.priority]}>{priorityLabels[task.priority]}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(task.dueDate)}</span>
      </div>
      {canUpdateStatus ? (
        <div className="mt-4">
          <Select value={task.status} onValueChange={(value) => onStatusChange(task, value as TaskStatus)}>
            <SelectTrigger aria-label="Update task status" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: task.assignedTo.avatarColor }}>
          {initials(task.assignedTo.name)}
        </span>
        {task.assignedTo.name}
      </div>
    </Card>
  );
}
