"use client";

import { Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { KanbanBoard } from "@/components/projects/kanban-board";
import { ProjectForm, ProjectFormValues } from "@/components/projects/project-form";
import { TaskForm, TaskFormValues } from "@/components/projects/task-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiMessage } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { Priority, Project, Task, TaskStatus } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const toast = useToastStore((state) => state.toast);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");

  const isAdmin = Boolean(project && user && user.role === "admin" && project.admin._id === user._id);

  const load = async () => {
    setLoading(true);
    try {
      const [projectResponse, taskResponse] = await Promise.all([
        api.get<{ project: Project }>(`/projects/${params.projectId}`),
        api.get<{ tasks: Task[] }>(`/projects/${params.projectId}/tasks`, { params: { limit: 100 } })
      ]);
      setProject(projectResponse.data.project);
      setTasks(taskResponse.data.tasks);
    } catch (error) {
      toast({ title: "Project unavailable", description: apiMessage(error), variant: "destructive" });
      router.replace("/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params.projectId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("project:join", params.projectId);
    socket.on("task:created", (task: Task) => setTasks((current) => current.some((item) => item._id === task._id) ? current : [task, ...current]));
    socket.on("task:updated", (task: Task) => setTasks((current) => current.map((item) => item._id === task._id ? task : item)));
    socket.on("task:deleted", ({ taskId }: { taskId: string }) => setTasks((current) => current.filter((item) => item._id !== taskId)));
    socket.on("project:updated", () => load());
    socket.on("member:added", () => load());
    socket.on("member:removed", () => load());
    return () => {
      socket.emit("project:leave", params.projectId);
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
      socket.off("project:updated");
      socket.off("member:added");
      socket.off("member:removed");
    };
  }, [params.projectId]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = [task.title, task.description, task.assignedTo.name].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || task.status === status;
    const matchesPriority = priority === "all" || task.priority === priority;
    return matchesSearch && matchesStatus && matchesPriority;
  }), [priority, search, status, tasks]);

  const createTask = async (values: TaskFormValues) => {
    const { data } = await api.post<{ task: Task }>(`/projects/${params.projectId}/tasks`, values);
    setTasks((current) => [data.task, ...current]);
    setTaskOpen(false);
    toast({ title: "Task created", description: data.task.title });
  };

  const updateTask = async (task: Task, values: TaskFormValues) => {
    const { data } = await api.patch<{ task: Task }>(`/tasks/${task._id}`, values);
    setTasks((current) => current.map((item) => item._id === task._id ? data.task : item));
    toast({ title: "Task updated", description: data.task.title });
  };

  const updateStatus = async (task: Task, nextStatus: TaskStatus) => {
    const { data } = await api.patch<{ task: Task }>(`/tasks/${task._id}`, { status: nextStatus });
    setTasks((current) => current.map((item) => item._id === task._id ? data.task : item));
  };

  const deleteTask = async (task: Task) => {
    await api.delete(`/tasks/${task._id}`);
    setTasks((current) => current.filter((item) => item._id !== task._id));
    toast({ title: "Task deleted", description: task.title });
  };

  const updateProject = async (values: ProjectFormValues) => {
    const { data } = await api.patch<{ project: Project }>(`/projects/${params.projectId}`, values);
    setProject(data.project);
    setEditOpen(false);
    toast({ title: "Project updated", description: data.project.title });
  };

  const deleteProject = async () => {
    await api.delete(`/projects/${params.projectId}`);
    toast({ title: "Project deleted" });
    router.replace("/projects");
  };

  const addMember = async () => {
    const { data } = await api.post<{ project: Project }>(`/projects/${params.projectId}/members`, { email: inviteEmail });
    setProject(data.project);
    setInviteEmail("");
    setInviteOpen(false);
    toast({ title: "Member added" });
  };

  const removeMember = async (userId: string) => {
    const { data } = await api.delete<{ project: Project }>(`/projects/${params.projectId}/members/${userId}`);
    setProject(data.project);
    toast({ title: "Member removed" });
  };

  if (loading || !project || !user) {
    return <div><Skeleton className="mb-6 h-16" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div>
      <PageHeader
        title={project.title}
        description={project.description || "No description"}
        action={
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild><Button variant="outline"><UserPlus className="h-4 w-4" /> Add member</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add member</DialogTitle><DialogDescription>Add an existing user by email.</DialogDescription></DialogHeader>
                    <div className="space-y-3">
                      <Label htmlFor="invite">Email</Label>
                      <Input id="invite" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
                      <Button className="w-full" onClick={addMember} disabled={!inviteEmail}>Add member</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild><Button variant="outline">Edit</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit project</DialogTitle></DialogHeader>
                    <ProjectForm defaultValues={project} submitLabel="Save project" onSubmit={updateProject} />
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={deleteProject}><Trash2 className="h-4 w-4" /> Delete</Button>
              </>
            ) : null}
            {isAdmin ? (
              <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New task</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
                  <TaskForm members={project.members} submitLabel="Create task" onSubmit={createTask} />
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        }
      />
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
      <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
        {project.members.map((member) => (
          <span key={member._id} className="inline-flex items-center gap-2 rounded-md border bg-card px-2 py-1">
            {member.name}
            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground">
              {member.activeTaskCount || 0} active
            </span>
            {isAdmin && member._id !== project.admin._id ? <button className="text-destructive" onClick={() => removeMember(member._id)}>Remove</button> : null}
          </span>
        ))}
      </div>
      {filteredTasks.length ? (
        <KanbanBoard tasks={filteredTasks} project={project} currentUserId={user._id} onStatusChange={updateStatus} onUpdateTask={updateTask} onDeleteTask={deleteTask} />
      ) : (
        <EmptyState icon={Plus} title="No tasks found" description="Create a task or adjust the filters to see more work." />
      )}
    </div>
  );
}
