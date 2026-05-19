"use client";

import { CheckSquare, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiMessage } from "@/lib/api";
import { priorityLabels, priorityStyles, statusLabels } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { Priority, Task, TaskStatus } from "@/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const toast = useToastStore((state) => state.toast);

  useEffect(() => {
    api
      .get<{ tasks: Task[] }>("/tasks", { params: { limit: 100 } })
      .then(({ data }) => setTasks(data.tasks))
      .catch((error) => toast({ title: "Tasks unavailable", description: apiMessage(error), variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = useMemo(() => tasks.filter((task) => {
    const text = [task.title, task.description, task.project?.title].join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) && (status === "all" || task.status === status) && (priority === "all" || task.priority === priority);
  }), [priority, search, status, tasks]);

  return (
    <div>
      <PageHeader title="My Tasks" description="Everything assigned to you across projects." />
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <div className="flex items-center gap-2 rounded-md border bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input className="border-0 px-0 focus-visible:ring-0" placeholder="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus | "all")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(value) => setPriority(value as Priority | "all")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((task) => (
            <Link key={task._id} href={`/projects/${task.project._id}`}>
              <Card className="hover:border-primary/50">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-medium">{task.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{task.project.title} · Due {formatDate(task.dueDate)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{statusLabels[task.status]}</Badge>
                    <Badge variant={priorityStyles[task.priority]}>{priorityLabels[task.priority]}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={CheckSquare} title="No assigned tasks" description="Tasks assigned to you will appear here." />
      )}
    </div>
  );
}
