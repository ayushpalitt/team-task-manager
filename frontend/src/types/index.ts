export type Role = "admin" | "member";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "done";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  activeTaskCount?: number;
  projectCount?: number;
  taskCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Project = {
  _id: string;
  title: string;
  description: string;
  admin: User;
  members: User[];
  progress: number;
  taskCounts: {
    total: number;
    done: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  assignedTo: User;
  project: Project;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  _id: string;
  type: string;
  message: string;
  actor: User;
  project: string;
  task?: Task;
  createdAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type Dashboard = {
  totals: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
  };
  tasksByStatus: { name: string; value: number }[];
  tasksPerUser: { name: string; value: number }[];
  recentActivity: Activity[];
};
