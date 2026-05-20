# Team Task Manager

A full-stack team task management app built with Next.js, Express, Prisma, PostgreSQL, JWT authentication, Socket.io, Tailwind CSS, Zustand, React Hook Form, Zod, Axios, and Recharts.

The app supports admin-managed projects, member task access, realtime task updates, dashboard analytics, and production deployment with Vercel, Render, and Neon PostgreSQL.

## Features

- Signup and login with JWT authentication and bcrypt password hashing
- Role-based accounts: `admin` and `member`
- Protected frontend routes with persisted auth state
- Admin project creation, editing, deletion, and member assignment
- Admin members page to view users, active task counts, project counts, and remove member accounts
- Project member management with add/remove controls
- Members can view only projects where they have assigned tasks
- Members can update the status of their assigned tasks
- Admins see member task updates in realtime through Socket.io
- Kanban board with drag-and-drop task status updates
- Task creation, editing, deletion, search, filters, and priority/status controls
- Dashboard analytics with task totals, status charts, user task counts, and recent activity
- Profile and settings pages
- Responsive dark-mode SaaS UI with forms, dialogs, skeletons, empty states, and toasts

## Tech Stack

Frontend:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- React Hook Form
- Zod
- Recharts
- Socket.io Client

Backend:

- Node.js
- Express
- Prisma
- PostgreSQL
- Socket.io
- JWT
- bcryptjs
- Zod

Deployment:

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

## Folder Structure

```text
team-task-manager/
  backend/
    prisma/
      migrations/
      schema.prisma
    src/
      config/
      controllers/
      middleware/
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

## Local Setup

Install dependencies from the root folder:

```bash
npm install
```

Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Backend environment:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
CLIENT_URLS=http://localhost:3000
PORT=5000
```

Frontend environment:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Generate Prisma client and apply migrations:

```bash
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
```

Start frontend and backend together:

```bash
npm run dev
```

Local URLs:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
Health:   http://localhost:5000/health
```

## Production Deployment

Current production setup:

```text
Frontend: https://team-task-manager-frontend-vert.vercel.app
Backend:  https://team-task-manager-ne5e.onrender.com
Database: Neon PostgreSQL
```

### Backend On Render

Create a Render Web Service from the GitHub repository.

Recommended settings:

```text
Root Directory: backend
Build Command: npm install && npx prisma generate && npx prisma migrate deploy
Start Command: npm start
```

Render environment variables:

```env
NODE_ENV=production
DATABASE_URL=<your-neon-postgres-url>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://team-task-manager-frontend-vert.vercel.app
CLIENT_URLS=https://team-task-manager-frontend-vert.vercel.app,http://localhost:3000
```

Do not hard-code `PORT` on Render. Render provides the port automatically.

### Frontend On Vercel

Create a Vercel project from the GitHub repository.

Recommended settings:

```text
Root Directory: frontend
Build Command: npm run build
Install Command: npm install
```

Vercel environment variables:

```env
NEXT_PUBLIC_API_URL=https://team-task-manager-ne5e.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://team-task-manager-ne5e.onrender.com
```

After changing `NEXT_PUBLIC_*` variables, redeploy the Vercel project because these values are baked into the frontend build.

## API Overview

Authentication:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

Users:

```text
GET    /api/users
GET    /api/users/search
PATCH  /api/users/profile
DELETE /api/users/:userId
```

Projects:

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId
POST   /api/projects/:projectId/members
DELETE /api/projects/:projectId/members/:userId
```

Tasks:

```text
GET    /api/tasks
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId
```

Dashboard and activity:

```text
GET /api/dashboard
GET /api/activity
```

## Permission Rules

- Admin users can create projects.
- Project admins can edit/delete their own projects.
- Project admins can add/remove project members.
- Project admins can create, edit, assign, and delete tasks.
- Members can only see projects where they have assigned tasks.
- Members can update status and priority on tasks assigned to them.
- Admins can view all users in the members page.
- Admins can remove member accounts. Removed users' tasks are reassigned to the relevant project admin.

## Database Notes

This project uses Prisma with PostgreSQL.

Useful commands:

```bash
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
npm run prisma:deploy --workspace backend
npx prisma migrate status --schema backend/prisma/schema.prisma
```

If connecting to an existing PostgreSQL database that already has the app tables, Prisma may report `P3005` because the database is not empty. In that case, baseline the existing migration only after confirming the tables match the Prisma schema.

## Common Deployment Issues

If signup/login shows `Network Error`, check:

- Vercel has `NEXT_PUBLIC_API_URL` set to the Render backend `/api` URL.
- Vercel has been redeployed after setting the environment variables.
- Render has `CLIENT_URL` set to the exact Vercel frontend URL.
- Render has `CLIENT_URLS` set with the Vercel URL and local development URL.
- The frontend bundle does not contain `localhost:5000` in production.

If Render backend is slow on the first request, it may be waking from sleep on the free plan.

## Security Notes

- Never commit `.env` files.
- Rotate leaked database passwords or JWT secrets immediately.
- Use a strong production `JWT_SECRET`.
- Keep Neon, Render, and Vercel environment variables in their dashboards.
- Use HTTPS URLs in production environment variables.
