# NOOKK STUDIO

A luxury interior design portfolio website: a public marketing site, a full admin panel for managing
content, and the backend API behind both.

```
Nook-Studio/
├─ src/              # Frontend — React + Vite + TypeScript + Tailwind
├─ server/           # Backend — Express + TypeScript + Prisma + PostgreSQL
├─ vercel.json       # Two-service Vercel deployment (frontend + backend, one origin)
├─ package.json      # Frontend's own manifest — also declares `server` as an npm workspace
└─ README.md         # This file
```

This is an **npm workspace**: the root `package.json` lists `server` under `"workspaces"`, so a
single `npm install` at the repo root installs both the frontend's and the backend's dependencies
into one shared `node_modules`, with one `package-lock.json` at the root (there is no
`server/package-lock.json`). This matters for deployment — any platform that builds the `server/`
directory in isolation, without the root `package.json`/lockfile alongside it, won't find the
backend's dependencies. `npm install` from inside `server/` still works correctly (npm walks up to
the workspace root automatically), so the per-backend instructions in `server/README.md` are
unaffected; it's specifically a from-scratch/isolated build of `server/` alone that needs the root
files present too (see `server/Dockerfile`, which now builds from the repo root for this reason).

See `server/README.md` for everything backend-specific (data model, full API reference, deployment to
Render/Railway/a VPS/Vercel). This file covers running the two together.

## Stack

| | |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, Framer Motion, React Hook Form + Zod, Sonner (toasts), Axios |
| Backend | Express, TypeScript, Prisma, PostgreSQL, JWT + bcrypt, Cloudinary, Resend/Nodemailer |

## Running everything locally

You need PostgreSQL available (locally installed, Docker, or a hosted instance) and two terminals —
one for the backend, one for the frontend.

### 1. Backend

```bash
cd server
cp .env.example .env     # fill in DATABASE_URL, JWT_SECRET, etc. — see server/README.md
npm install
npm run prisma:migrate   # creates the schema
npm run seed               # creates 3 demo accounts (one per role) + sample content
npm run dev                 # http://localhost:4000, API docs at /api/docs
```

The seed script creates one account per role, for exercising role-based access control:

| Username | Password    | Role  | After login |
| -------- | ----------- | ----- | --- |
| `admin`  | `Admin@123` | ADMIN | `/admin` — full dashboard and all admin features |
| `staff`  | `Staff@123` | STAFF | `/` — public site only, `/admin/*` is blocked |
| `user`   | `User@123`  | USER  | `/` — public site only, `/admin/*` is blocked |

**Change these before deploying anywhere but a demo** — see `server/prisma/seed.ts`.

### 2. Frontend

In a second terminal, from the repo root:

```bash
cp .env.example .env      # VITE_API_URL — defaults to http://localhost:4000/api
npm install
npm run dev                 # http://localhost:5173
```

That's it — the public site at `/` and the admin panel at `/admin` both talk to the backend at
`VITE_API_URL`.

## What's where

- **Public site** (`/`): fetches projects, services, journal posts and testimonials live from the
  backend; the "Book a Free Consultation" form submits to `POST /api/inquiries` and triggers both a
  confirmation email to the visitor and a notification email to the studio (see `server/README.md`).
- **Admin panel** (`/admin`): log in at `/admin/login` with the seeded **admin** account to get a
  dashboard overview plus full CRUD for projects, journal posts, services and testimonials (with
  image uploads to Cloudinary), and an inquiries inbox with status management.

### Role-based access control

`AuthContext` (`src/context/AuthContext.tsx`) stores the JWT and the signed-in user (which carries
`role`), and exposes `role`, `isAuthenticated` and `isAdmin` to the rest of the app. `ProtectedRoute`
(`src/components/admin/ProtectedRoute.tsx`) wraps every `/admin/*` route and enforces:

- Not signed in → redirected to `/admin/login` (and back to where they were headed, after login).
- Signed in but `role !== 'ADMIN'` (staff/user) → redirected to `/` — the admin panel, its sidebar
  and every edit/delete control simply don't exist in their app; there's nothing to hide because the
  public pages never render admin-only UI to begin with.
- Signed in as `ADMIN` → the panel renders normally.

The login page (`src/pages/admin/Login.tsx`) branches the same way right after a successful login:
admins go to `/admin` (or wherever they were trying to reach), staff/user go to `/`. Logging out
(sidebar → Log out) clears the token and the user from `AuthContext` and returns to `/admin/login`.

### Frontend structure

```
src/
├─ components/           # Public site sections (Hero, FeaturedProjects, CTA, ...)
│  ├─ admin/              # Admin-only UI: layout, modals, confirm dialogs, uploaders, tables
│  └─ ui/                 # Small shared primitives (Logo, image skeleton, loading/error/empty states)
├─ context/AuthContext.tsx # Token persistence, session hydration, login/logout
├─ hooks/useAsync.ts       # Generic loading/error/data fetching hook
├─ lib/                   # api.ts (axios client), schemas.ts (Zod forms), icon/category maps
├─ services/              # One typed module per backend resource (projects, journal, auth, ...)
├─ types/api.ts           # Types mirroring the backend's Prisma models and response envelope
└─ pages/
   ├─ Home.tsx             # Assembles the public site
   ├─ NotFound.tsx          # 404
   └─ admin/                # Login, Dashboard, and one page per manageable resource
```

### Response format

The frontend expects every backend response as `{ success, data, message?, meta? }` (see
`server/README.md#response-format`). `src/lib/api.ts` normalizes failures into a single
`ApiClientError` (with `.message` and, for validation errors, `.details`), so every page handles
errors the same way.

## Environment variables

Frontend (`.env`, see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API, including the `/api` prefix. **Local dev:** set to `http://localhost:4000/api`. **Deployments where frontend and backend share one origin** (e.g. Vercel, see below): leave unset — the client falls back to a relative `/api`. |

Backend: see `server/.env.example` and `server/README.md`.

## Building for production

```bash
# backend
cd server && npm run build && npm run prisma:deploy && npm start

# frontend
npm run build   # outputs to dist/, served by any static host / reverse proxy
```

If the frontend and backend are deployed to different origins, set `VITE_API_URL` to the backend's
full URL before building — it's baked in at build time, not read at runtime.

### Deploying to Vercel

The root `vercel.json` deploys this as two Vercel services from one project — `app` (this repo's
root, Vite) and `server` (the `server/` directory, Express) — with `/api/(.*)` rewritten to `server`
and everything else to `app`. Because both end up on one origin, **leave `VITE_API_URL` unset** on
the Vercel project so the frontend's relative `/api` calls get rewritten to the backend correctly.
Set the backend's env vars (`DATABASE_URL`, `JWT_SECRET`, Cloudinary, email, etc. — see
`server/.env.example`) on the `server` service, and run `npm run seed` once against that
`DATABASE_URL` after the first deploy to create the three demo accounts.
