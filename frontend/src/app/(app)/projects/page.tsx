"use client";

import { FolderKanban, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProjectForm, ProjectFormValues } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { Project, User } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const user = useAuthStore((state) => state.user);
  const toast = useToastStore((state) => state.toast);
  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ projects: Project[] }>("/projects", { params: { search } });
      setProjects(data.projects);
    } catch (error) {
      toast({ title: "Projects unavailable", description: apiMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(load, 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get<{ users: User[] }>("/users")
      .then(({ data }) => setMembers(data.users.filter((item) => item._id !== user?._id && item.role === "member")))
      .catch((error) => toast({ title: "Members unavailable", description: apiMessage(error), variant: "destructive" }));
  }, [isAdmin, toast, user?._id]);

  const create = async (values: ProjectFormValues) => {
    const { data } = await api.post<{ project: Project }>("/projects", values);
    setProjects((current) => [data.project, ...current]);
    setOpen(false);
    toast({ title: "Project created", description: data.project.title });
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description={isAdmin ? "Create workspaces, invite members, and track progress." : "Projects with tasks assigned to you."}
        action={
          isAdmin ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> New project</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create project</DialogTitle>
                  <DialogDescription>Project creators automatically become admins.</DialogDescription>
                </DialogHeader>
                <ProjectForm availableMembers={members} submitLabel="Create project" onSubmit={create} />
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <div className="mb-4 flex items-center gap-2 rounded-md border bg-card px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input className="border-0 px-0 shadow-none focus-visible:ring-0" placeholder="Search projects" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-48" />)}
        </div>
      ) : projects.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/projects/${project._id}`} key={project._id}>
              <Card className="h-full hover:border-primary/50">
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{project.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                  <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project.members.length} members</span>
                    <span>{project.taskCounts.total} tasks</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={isAdmin ? "Create a project to start planning team work." : "Projects appear here when an admin assigns tasks to you."}
          action={isAdmin ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New project</Button> : undefined}
        />
      )}
    </div>
  );
}
