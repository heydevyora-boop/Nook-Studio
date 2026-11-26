# Making the live contact form work (Netlify frontend + separate backend)

**Symptom:** on nookkstudio.com, "Send Message" fails and the browser console shows
`POST /api/inquiries … 404`.

**Cause:** Netlify only hosts the static frontend. With `VITE_API_URL` unset, the
form posts to `https://nookkstudio.com/api/inquiries` (Netlify itself), where no
API exists. The Express backend in `server/` must be deployed somewhere else and the
frontend told its address.

## 1. Deploy the backend (Render example — `server/render.yaml` is included)

1. Render → **New → Blueprint** (or Web Service) → connect this repo, root dir `server`.
2. Set these environment variables on the Render service (Environment tab):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **Session Pooler** string (see note below) |
| `JWT_SECRET` | any random string, 32+ characters |
| `CORS_ORIGIN` | `https://nookkstudio.com,https://www.nookkstudio.com` |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | from the sheet URL |
| `GOOGLE_SHEETS_SHEET_NAME` | tab name, e.g. `Sheet1` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key |
| `GOOGLE_PRIVATE_KEY` | `private_key` from the JSON key |

   (Mail/other variables: see `server/.env.example`.)

3. Deploy. The start command runs `prisma migrate deploy` automatically.
4. Check `https://<your-service>.onrender.com/api/health` (or the health route in
   `server/src/routes`) returns OK.

**Supabase note:** Render connects over IPv4, and Supabase's *direct* host
(`db.<ref>.supabase.co`) is IPv6-only, so use the **Session Pooler** string:
user `postgres.<project-ref>`, host `aws-0-<region>.pooler.supabase.com`, port `5432`,
password URL-encoded (`@`→`%40`, `#`→`%23`, `/`→`%2F`, `:`→`%3A`, `?`→`%3F`).

## 2. Point the frontend at the backend

Netlify → Site configuration → **Environment variables** → add

    VITE_API_URL = https://<your-service>.onrender.com/api

(must end in `/api`). This is read at **build** time, so then trigger
**Deploys → Trigger deploy → Clear cache and deploy site**.

## 3. Verify

Open nookkstudio.com, submit the form with DevTools → Network open:
`POST …/api/inquiries` should return **201**, the success message appears, the row
shows up in the Google Sheet and in the admin Inquiries page.

| Still seeing | Meaning |
|---|---|
| `404` on `nookkstudio.com/api/...` | `VITE_API_URL` not set, or site not rebuilt after setting it |
| CORS error in console | `CORS_ORIGIN` on the backend doesn't list your exact site origin |
| `502/503` or timeout | backend not running / still waking (Render free tier sleeps) — check its logs |
| `500` | backend can't reach the database — fix `DATABASE_URL` (Prisma `P1001`) |
