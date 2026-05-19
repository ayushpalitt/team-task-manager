"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiMessage } from "@/lib/api";
import { statusLabels } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { Dashboard } from "@/types";

const colors = ["#2563eb", "#0f766e", "#16a34a"];

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const toast = useToastStore((state) => state.toast);

  useEffect(() => {
    api
      .get<Dashboard>("/dashboard")
      .then(({ data }) => setDashboard(data))
      .catch((error) => toast({ title: "Dashboard unavailable", description: apiMessage(error), variant: "destructive" }));
  }, [toast]);

  if (!dashboard) {
    return (
      <div>
        <PageHeader title="Dashboard" description="A live view of team work across your projects." />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Tasks", value: dashboard.totals.totalTasks, icon: ListChecks },
    { label: "Completed", value: dashboard.totals.completedTasks, icon: CheckCircle2 },
    { label: "Pending", value: dashboard.totals.pendingTasks, icon: Clock3 },
    { label: "Overdue", value: dashboard.totals.overdueTasks, icon: AlertTriangle }
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="A live view of team work across your projects." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                </div>
                <span className="rounded-md bg-secondary p-3">
                  <Icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboard.tasksByStatus.map((item) => ({ ...item, name: statusLabels[item.name as keyof typeof statusLabels] || item.name }))} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={3}>
                  {dashboard.tasksByStatus.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks per User</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.tasksPerUser}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {dashboard.recentActivity.length ? dashboard.recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">by {activity.actor.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span>
              </div>
            )) : <p className="py-6 text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
