import { ArrowRight, CheckCircle2, LayoutDashboard, LockKeyhole, UsersRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const columns = [
  {
    title: "To Do",
    tasks: ["Scope dashboard metrics", "Invite product team"]
  },
  {
    title: "In Progress",
    tasks: ["Build Kanban workflow", "Review API permissions"]
  },
  {
    title: "Done",
    tasks: ["Create PostgreSQL schema", "Ship auth flow"]
  }
];

const features = [
  { icon: LayoutDashboard, title: "Project clarity", text: "Track progress, ownership, and due dates from one focused workspace." },
  { icon: UsersRound, title: "Admin and member roles", text: "Create projects as an admin or join execution as a member." },
  { icon: LockKeyhole, title: "Secure access", text: "JWT authentication keeps team work protected across sessions." }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">T</span>
          Team Task Manager
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Plan, assign, and ship team work faster
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl lg:text-6xl">
            Team Task Manager
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            A clean project workspace for teams that need Kanban boards, analytics, secure roles, and responsive task management without clutter.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="default" className="h-11 px-5">
              <Link href="/signup">
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="h-11 px-5">
              <Link href="/login">Login to workspace</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 rounded-lg border bg-card p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Product Launch</p>
              <p className="text-sm text-muted-foreground">8 tasks · 4 members · 72% complete</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted sm:w-56">
              <div className="h-full w-[72%] rounded-full bg-primary" />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title} className="rounded-lg border bg-secondary/40 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{column.title}</h2>
                  <span className="rounded-md bg-card px-2 py-1 text-xs text-muted-foreground">{column.tasks.length}</span>
                </div>
                <div className="space-y-3">
                  {column.tasks.map((task) => (
                    <div key={task} className="rounded-lg border bg-card p-3">
                      <p className="text-sm font-medium">{task}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Medium</span>
                        <span>May 28</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-lg border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
