# Team Task Manager

A production-ready Trello/Asana-style team task manager built with Next.js 15, TypeScript, Tailwind CSS, Express, PostgreSQL, Prisma, JWT authentication, Zustand, React Hook Form, Zod, Axios, Recharts, and Socket.io.

## Features

- JWT signup/login with bcrypt password hashing
- Persistent protected frontend routes
- Project admins and project members
- Project CRUD with member management
- Kanban task board with drag-and-drop status updates
- Task filters, search, sorting, pagination, edit, delete
- Role-aware task permissions
- Dashboard analytics with Recharts
- Activity logs and real-time updates with Socket.io
- Responsive SaaS UI with dark mode, skeletons, toasts, modals, tables, forms, and empty states
- Profile and settings pages
- Railway-ready frontend and backend configs

## Folder Structure

```text
team-task-manager/
  backend/
    src/
      config/
      controllers/
      middleware/
      prisma/
      routes/
      services/
      sockets/
      utils/
      validators/
  frontend/
    src/
      app/
      components/
      lib/
      store/
      types/
```

## Prerequisites

- Node.js 20.11+
- PostgreSQL 14+ locally or Railway Postgres
- npm 10+

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Update `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/team_task_manager?schema=public
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:3000
```

4. Update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

5. Create and apply the database migration:

```bash
npm run prisma:migrate --workspace backend
```

6. Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:5000`

## Railway Deployment

### Backend Service

1. Create a Railway service from this repository.
2. Set the root directory to `backend`.
3. Add variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<your-railway-postgres-url>
JWT_SECRET=<long-random-secret>
CLIENT_URL=<your-frontend-url>
JWT_EXPIRES_IN=7d
```

4. Railway will use `backend/railway.json`.

### Frontend Service

1. Create a second Railway service from the same repository.
2. Set the root directory to `frontend`.
3. Add variables:

```env
NEXT_PUBLIC_API_URL=<your-backend-url>/api
NEXT_PUBLIC_SOCKET_URL=<your-backend-url>
```

4. Railway will use `frontend/railway.json`.

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/users/profile`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:userId`
- `GET /api/projects/:projectId/tasks`
- `POST /api/projects/:projectId/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `GET /api/dashboard`
- `GET /api/activity`
- `GET /api/users/search`

## Permissions

- Project creator automatically becomes project admin.
- Project admins can manage project details, members, and all tasks.
- Members can view joined projects and update only tasks assigned to them.

## Production Notes

- Use a strong `JWT_SECRET`.
- Use Railway Postgres or another managed PostgreSQL provider.
- Configure `CLIENT_URL` exactly to avoid CORS issues.
- Store environment variables in Railway, not in source control.
