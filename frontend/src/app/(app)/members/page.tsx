"use client";

import { Search, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiMessage } from "@/lib/api";
import { initials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { User } from "@/types";

export default function MembersPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const toast = useToastStore((state) => state.toast);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ users: User[] }>("/users");
      setUsers(data.users);
    } catch (error) {
      toast({ title: "Members unavailable", description: apiMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    load();
  }, [currentUser, router]);

  const filteredUsers = useMemo(() => {
    const text = search.toLowerCase();
    return users.filter((user) => [user.name, user.email, user.role].join(" ").toLowerCase().includes(text));
  }, [search, users]);

  const removeUser = async (user: User) => {
    const confirmed = window.confirm(`Remove ${user.name}? Their tasks will be reassigned to you.`);
    if (!confirmed) return;

    try {
      await api.delete(`/users/${user._id}`);
      setUsers((current) => current.filter((item) => item._id !== user._id));
      toast({ title: "Member removed", description: user.name });
    } catch (error) {
      toast({ title: "Could not remove member", description: apiMessage(error), variant: "destructive" });
    }
  };

  if (!currentUser || currentUser.role !== "admin") {
    return <div><Skeleton className="mb-6 h-16" /><Skeleton className="h-72" /></div>;
  }

  return (
    <div>
      <PageHeader title="Members" description="View active members and remove accounts when needed." />
      <div className="mb-4 flex items-center gap-2 rounded-md border bg-card px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          className="border-0 px-0 shadow-none focus-visible:ring-0"
          placeholder="Search members"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-24" />)}
        </div>
      ) : filteredUsers.length ? (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isSelf = user._id === currentUser._id;
            const isProtectedAdmin = user.role === "admin";
            return (
              <Card key={user._id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: user.avatarColor }}>
                      {initials(user.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-medium">{user.name}</h2>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge variant="secondary">{user.activeTaskCount || 0} active tasks</Badge>
                    <Badge variant="secondary">{user.projectCount || 0} projects</Badge>
                    <Badge variant="secondary">{user.taskCount || 0} total tasks</Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isSelf || isProtectedAdmin}
                      onClick={() => removeUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Users} title="No members found" description="Try a different search term." />
      )}
    </div>
  );
}
