# NOOKK STUDIO — Backend API

Production-ready REST API for the NOOKK STUDIO portfolio site: Node.js + TypeScript + Express, PostgreSQL via Prisma, JWT admin auth, Cloudinary uploads, and transactional email on new inquiries.

## Tech stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT + bcrypt (single `ADMIN` role)
- **Validation:** Zod (parses and types every request body/query/params)
- **Uploads:** Multer (memory storage) → Cloudinary
- **Email:** Resend, falling back to SMTP/Nodemailer if `RESEND_API_KEY` is unset
- **Security:** helmet, cors, express-rate-limit (global + stricter limits on `/auth/login` and `/inquiries`)
- **Docs:** OpenAPI 3 via swagger-jsdoc, served with swagger-ui-express

> Note on scope: the brief also listed `express-validator` under security tooling alongside Zod. Both do the same job, so this project validates exclusively with Zod to avoid two overlapping validation layers.

## Project layout

```
server/
├─ prisma/
│  ├─ schema.prisma        # Data model
│  ├─ migrations/          # SQL migration history (committed)
│  └─ seed.ts              # Creates the 3 demo accounts (one per role) + sample content
└─ src/
   ├─ config/              # env, cloudinary, mail, swagger
   ├─ lib/                 # prisma client singleton, logger
   ├─ middleware/           # auth, validate, rateLimit, errorHandler, notFound
   ├─ utils/                # ApiError, ApiResponse, asyncHandler, slugify, pagination
   ├─ modules/
   │  ├─ auth/              # register (bootstrap-only), login, me
   │  ├─ projects/          # public + admin routers share one service
   │  ├─ services/
   │  ├─ journal/
   │  ├─ inquiries/
   │  ├─ testimonials/
   │  ├─ upload/            # Cloudinary image upload
   │  └─ health/
   ├─ routes/index.ts       # mounts every module under /api
   ├─ app.ts                # Express app assembly (middleware + routes)
   └─ index.ts              # bootstrap, listen, graceful shutdown
```

Each content module follows the same shape: `*.schema.ts` (Zod) → `*.service.ts` (Prisma queries, business rules) → `*.controller.ts` (thin HTTP glue) → `*.routes.ts` (public) / `*.admin.routes.ts` (JWT-protected).

## Getting started

```bash
cp .env.example .env    # then fill in real values
npm install
npm run prisma:migrate  # creates the DB schema (dev)
npm run seed             # creates the admin/staff/user demo accounts + sample content
npm run dev               # http://localhost:4000, docs at /api/docs
```

Required env vars are validated at boot with Zod (`src/config/env.ts`) — the process fails fast with a clear error if something required is missing. See `.env.example` for the full list and defaults.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:deploy` | Apply migrations in production (no prompts) |
| `npm run seed` | Create the admin/staff/user demo accounts + sample services/projects/testimonials |
| `npm run prisma:studio` | Open Prisma Studio |

## Authentication & roles

Login is by **username**, not email — `POST /api/auth/login` takes `{ username, password }` and returns `{ user, token }`. Send the token as `Authorization: Bearer <token>` on every authenticated route.

Three roles exist (`Role` enum: `ADMIN`, `STAFF`, `USER`). `npm run seed` creates one demo account per role:

| Username | Password    | Role  |
| -------- | ----------- | ----- |
| `admin`  | `Admin@123` | ADMIN |
| `staff`  | `Staff@123` | STAFF |
| `user`   | `User@123`  | USER  |

Change these before using this seed anywhere but a demo. All `/api/admin/*` routes require a valid token (`requireAuth`) and the `ADMIN` role specifically (`requireRole('ADMIN')`, composed as `requireAdmin`) — a valid STAFF or USER token is authenticated but gets `403 Forbidden` on every admin route; the frontend's `ProtectedRoute` enforces the same rule before a request is even made (see root `README.md`).

`POST /api/auth/register` is a separate, bootstrap-only path for creating the first admin without a seed: it only ever succeeds once, the moment any `User` row exists it returns `403`. Since the seed already creates three users, `register` is locked by default in this project unless you seed an empty database.

## Data model

`User`, `Project`, `Service`, `JournalPost`, `Inquiry`, `Testimonial` — see `prisma/schema.prisma` for exact fields. Highlights:

- **Soft delete** on `Project`, `Service`, `JournalPost`, `Testimonial` via a nullable `deletedAt`; admin "delete" sets this instead of removing the row, and every query filters `deletedAt: null`.
- **Slugs** are auto-generated from `title`/`clientName` via `utils/slugify.ts` (`generateUniqueSlug`), appending `-2`, `-3`, … on collision. Admins may also supply an explicit `slug` in the request body, validated for uniqueness.
- **`Project.category`** is a Postgres enum (`INTERIOR_DESIGN`, `PRODUCT_DESIGN`, `SPACE_PLANNING`, `DESIGN_CONSULTATION`) for query-safety; map these to display labels in the frontend.
- Public project/journal endpoints only ever return `PUBLISHED`/`published: true` + non-deleted rows; admin endpoints see everything (minus soft-deleted).

## API surface

Full interactive docs: `GET /api/docs` (OpenAPI JSON at `/api/docs.json`).

**Public**
```
GET  /api/health
GET  /api/projects              ?page&limit&category&featured
GET  /api/projects/:slug
GET  /api/services
GET  /api/journal                ?page&limit
GET  /api/journal/:slug
POST /api/inquiries               (rate-limited)
GET  /api/testimonials
```

**Admin** (`Authorization: Bearer <token>`)
```
POST  /api/auth/register          (bootstrap only)
POST  /api/auth/login
GET   /api/auth/me

GET   /api/admin/inquiries        ?page&limit&status
PATCH /api/admin/inquiries/:id    { status }

GET|POST          /api/admin/projects        ?page&limit&category&featured&status
GET|PATCH|DELETE  /api/admin/projects/:id

GET|POST          /api/admin/services
GET|PATCH|DELETE  /api/admin/services/:id

GET|POST          /api/admin/journal         ?page&limit
GET|PATCH|DELETE  /api/admin/journal/:id

GET|POST          /api/admin/testimonials
GET|PATCH|DELETE  /api/admin/testimonials/:id

POST  /api/admin/upload           (multipart "file" field → Cloudinary)
```

> Admin CRUD for testimonials isn't in the original endpoint list but was added — without it there'd be no way to manage that model short of editing the database directly.

### Response format

Every response follows the same envelope:

```jsonc
// success
{ "success": true, "data": { /* ... */ }, "message": "Project updated successfully" }
// paginated list
{ "success": true, "data": [ /* ... */ ], "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
// error
{ "success": false, "data": null, "message": "Validation failed", "details": { /* per-field errors, if any */ } }
```

`message` is present on writes (create/update/delete/login/etc.) and omitted on plain reads; `meta` is present only on paginated list endpoints.

### Inquiry form fields

`POST /api/inquiries` accepts: `name`, `email`, `phone`, `projectType`, `budget`, `areaSqFt`, `message` (`name`/`email`/`message` required). Submitting it:

1. Stores the inquiry (`status: NEW`) in PostgreSQL — the source of truth.
2. Sends a branded confirmation email to the **client**'s address.
3. Sends a notification email to `STUDIO_NOTIFICATION_EMAIL` (if set) with the full submission.
4. Appends the inquiry as a row in the studio's Google Sheet (if configured — see [Google Sheets integration](#google-sheets-integration)).

Both emails are fire-and-forget and independent of each other — a bad client address or a down mail provider never fails the submission itself (see `modules/inquiries/inquiries.emails.ts` for the templates).

## Google Sheets integration

Every inquiry is mirrored as a new row in a Google Sheet ("Nookks Studio Database"), as a live reporting/tracking view. PostgreSQL stays the primary database; the sheet is an additional destination and is **optional** — with the variables unset the API behaves exactly as before.

### How it works

```
Visitor → Send Message → POST /api/inquiries → Zod validation → INSERT into PostgreSQL
                                                                       │
                       (visitor gets the normal success response) ◄────┤
                                                                       ▼
                                          Google Sheets sync (service account, googleapis)
                                          ├─ already in the sheet? (ID in column A) → mark SYNCED
                                          └─ otherwise append one row → mark SYNCED
                                          on failure → record error, retry with backoff
```

- **The sheet can never lose or break a submission.** The inquiry is committed to PostgreSQL first. A Sheets outage, bad credentials or quota error is recorded on the inquiry (`sheetsSyncStatus`, `sheetsSyncAttempts`, `sheetsLastError`) and retried — the visitor still sees the normal success message and never sees Google error text.
- **Honest status.** `sheetsSyncStatus` is `PENDING` until the row is confirmed in the sheet, then `SYNCED`. It is visible to admins in `GET /api/admin/inquiries`.
- **No duplicates.** (1) Identical submissions within 10 minutes (double-click, network retry) resolve to the *same* inquiry via a unique `submissionKey`. (2) Before appending, the worker looks for the inquiry's ID in column A, so a retry after a lost response never adds a second row. (3) A short DB lease stops two attempts/instances working on one inquiry at once.
- **Retries.** A background worker (every 60 s) retries due `PENDING` inquiries oldest-first with backoff 1, 2, 5, 10, 20, 30, 60 min… After 10 failed attempts an inquiry becomes `FAILED`; all `FAILED` inquiries are re-queued automatically on the next server start (so "fix credentials → redeploy" self-heals). Run `npm run sheets:sync` to flush immediately.
- **Security.** Credentials live only in backend env vars. Cells starting with `=`, `+`, `-` or `@` are prefixed with `'` so they can't run as formulas (phone numbers like `+91 …` are left intact); rows are written with `valueInputOption: RAW`; oversize messages are truncated to Google's 50,000-char cell limit (the full text stays in PostgreSQL).
- **Existing inquiries.** The migration marks inquiries that already exist as `PENDING`, so the first time Sheets is configured they are back-filled into the sheet, oldest first. If you only want *new* inquiries in the sheet, run once before configuring Sheets:
  `UPDATE inquiries SET "sheetsSyncStatus" = 'SYNCED' WHERE "sheetsSyncStatus" = 'PENDING';`
- Changing an inquiry's status in the admin dashboard does **not** update the sheet's *Inquiry Status* column (it records the status at submission time, `NEW`).

### Sheet layout (created automatically if row 1 is empty)

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Submission ID | Submission Date (IST) | Full Name | Email | Phone | Project Type | Area (Sq. Ft.) | Investment / Budget | Message | Inquiry Status |

Header row is bold and frozen, columns are sized, and *Message* wraps. If row 1 already holds *different* content the integration refuses to touch the sheet (it never overwrites data) and reports why.

### One-time Google setup

1. **Google Cloud project** — <https://console.cloud.google.com> → create (or pick) a project.
2. **Enable the API** — *APIs & Services → Library* → search **Google Sheets API** → **Enable**. (The Drive API is *not* needed.)
3. **Service account** — *IAM & Admin → Service Accounts → Create service account*. Name it e.g. `nookk-sheets-writer`. No project roles are required. Click *Done*.
4. **Key** — open the service account → *Keys → Add key → Create new key → JSON*. A `.json` file downloads. Treat it like a password: don't commit it, don't email it. (If key creation is blocked, your Google Workspace org enforces `iam.disableServiceAccountKeyCreation`; an org admin must allow it.)
5. **Share the sheet** — open **Nookks Studio Database** → **Share** → paste the service account's email (the JSON's `client_email`, ends in `.iam.gserviceaccount.com`) → role **Editor** → untick "Notify people" → **Share**. *This is the step most often forgotten and causes `403` / `404` errors.*
6. Copy the **spreadsheet ID** from the sheet's URL: `https://docs.google.com/spreadsheets/d/`**`<THIS_PART>`**`/edit`.
7. Note the **worksheet (tab) name** at the bottom-left of the sheet (default `Sheet1`).

### Environment variables (backend only)

| Variable | Value |
|---|---|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID from step 6 |
| `GOOGLE_SHEETS_SHEET_NAME` | tab name from step 7 (default `Sheet1`; created if it doesn't exist) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key |
| `GOOGLE_PRIVATE_KEY` | `private_key` from the JSON key — paste as-is, or as one line with literal `\n`s, quotes optional |

**Where to set them:** on the host that runs this Express API (Render / Railway / Vercel `server` service / your VPS). **Netlify only serves the static frontend — Netlify environment variables are never visible to the backend**, and these must never be `VITE_*` variables.

- **Render:** Dashboard → your `nookk-studio-api` service → **Environment** → *Add Environment Variable* (×4) → Save (Render redeploys). The keys are already declared in `render.yaml` with `sync: false`.
- **Railway:** service → **Variables** → *New Variable* (×4) (or *Raw Editor*) → deploy.
- **Docker / VPS:** add them to `server/.env` (git-ignored).

After deploying, verify credentials and prepare the sheet:

```bash
npm run sheets:setup     # local, or on the host:  node dist/scripts/sheets.js setup
npm run sheets:status    # PENDING / SYNCED / FAILED counts
npm run sheets:sync      # re-queue FAILED + push everything pending right now
```

Startup logs say which mode you're in: `Google Sheets sync enabled`, `…not configured`, or `…DISABLED — incomplete configuration, missing: …`.

> **Hosting note:** the retry worker needs a long-lived Node process (Render, Railway, VPS, Docker). On a serverless host (e.g. Vercel Functions) the first attempt still runs during the request, but background retries won't — use `npm run sheets:sync` from a scheduled job there.

### Tests

```bash
createdb nookk_test && DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nookk_test npx prisma migrate deploy
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nookk_test npm test
```

Runs the real Express app against a real database with a fake Google (28 tests: field mapping, optional fields, duplicates, outage/auth-failure/lost-response retries, formula injection, admin endpoints) plus the real `googleapis` client against a local fake of the Sheets REST API. The suite deletes all inquiries, so it refuses to run unless the database name contains `test`.

## Key behaviors

- **Validation:** every route with a body/query/params runs through `middleware/validate.ts`, which parses with Zod and returns `400` with per-field errors on failure.
- **Rate limiting:** a generous global limiter (300 req / 15 min), a stricter one on `/auth/login` (20 / 15 min), and a dedicated one on `POST /inquiries` (`INQUIRY_RATE_LIMIT_MAX` per `INQUIRY_RATE_LIMIT_WINDOW_MINUTES`, default 5/hour) to curb contact-form spam.
- **Email on inquiry:** see above — client confirmation + admin notification, both best-effort.
- **Google Sheets mirror:** see [Google Sheets integration](#google-sheets-integration) — best-effort, retried, duplicate-proof.
- **Errors:** a single `errorHandler` middleware maps `ApiError`s, known Prisma errors (unique constraint → 409, not found → 404) and anything unexpected → 500, hiding internal messages in production.
- **Image uploads:** `POST /api/admin/upload` streams a single `multipart/form-data` file (field `file`, ≤10MB, image types only) straight to Cloudinary from memory — no temp files on disk — and returns `{ url, publicId }` to store on a project/post.

## CORS

`CORS_ORIGIN` in `.env` is a comma-separated allowlist read at boot (`src/config/env.ts`) and passed straight to the `cors` middleware with `credentials: true`. For local development against the Vite frontend it defaults to `http://localhost:5173`; in production, set it to your deployed frontend's exact origin(s) (e.g. `https://nookkstudio.com,https://www.nookkstudio.com`).

## Deploying

The repo includes ready-to-use config for four common targets (including Vercel). In every case: provision PostgreSQL, set `DATABASE_URL`, set a strong `JWT_SECRET`, set real `CORS_ORIGIN`, Cloudinary credentials, and either `RESEND_API_KEY` or `SMTP_*` — then run the seed **once** to create the demo accounts (or call `POST /api/auth/register` yourself before anyone else can, against an otherwise-empty database). Change the seeded passwords before using any of this beyond a demo.

### Vercel

The root `vercel.json` deploys this repo as two Vercel services from one project: `app` (the Vite frontend, at the repo root) and `server` (this directory, as an Express service), with `/api/(.*)` rewritten to `server` and everything else to `app`. Because both end up on one origin, leave the frontend's `VITE_API_URL` **unset** in the Vercel project so it falls back to a relative `/api` (see the root README). Set this directory's env vars (`DATABASE_URL`, `JWT_SECRET`, Cloudinary, email, etc.) on the `server` service in the Vercel dashboard, and run `npm run seed` once against that `DATABASE_URL` after the first deploy.

### Render

1. Push this repo to GitHub.
2. In the Render dashboard: **New +** → **Blueprint**, point it at this repo (`server/render.yaml`). This provisions a managed Postgres database and a web service together, wires `DATABASE_URL` automatically, and generates `JWT_SECRET`.
3. Fill in the remaining env vars flagged `sync: false` in the Render dashboard (Cloudinary, email, `CORS_ORIGIN`).
4. Render runs `npm install && npm run build` to build, then `npx prisma migrate deploy && npm start` on every deploy — migrations are applied automatically before the server starts.
5. Once live, run `npm run seed` locally against the production `DATABASE_URL` (or trigger it as a one-off Render job) to create the demo accounts.

### Railway

1. `railway init` (or link this repo from the Railway dashboard) and add a PostgreSQL plugin.
2. Railway auto-detects `railway.json` for the build/start commands (same as Render: migrate-then-start on every deploy).
3. Set `DATABASE_URL` from the Postgres plugin's reference variable, plus the same env vars listed above.
4. Deploy, then run the seed once (`railway run npm run seed`).

### VPS (Docker)

```bash
cp .env.example .env    # fill in real values; DATABASE_URL below is overridden for the db service
docker compose up --build -d
docker compose exec api npm run seed   # once, to create the demo accounts
```

`docker-compose.yml` runs Postgres and the API together, applying migrations automatically on container start (see the `Dockerfile`'s `CMD`). For a bare VPS without Docker: install Node 20+, clone the repo, `npm install && npm run build`, run `npm run prisma:deploy && npm run seed` once, then run `npm start` behind a process manager (e.g. `pm2 start dist/index.js --name nookk-studio-api`) and a reverse proxy (nginx/Caddy) terminating TLS in front of port 4000.

> Why `prisma` is a regular (not dev) dependency: the container's runtime stage installs with `--omit=dev`, but its `CMD` runs `npx prisma migrate deploy` on every start. `prisma` (the CLI) has to survive that prune for migrations to run without reaching out to the registry at boot — only `@prisma/client` is required at runtime otherwise.
