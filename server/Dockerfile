# Built from the REPO ROOT as build context (see docker-compose.yml), not from
# this server/ directory — the backend is an npm workspace member, so its
# dependencies are installed via the root package-lock.json.

# --- Build stage -------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY server/prisma ./server/prisma
# `npm ci` triggers `server`'s postinstall -> `prisma generate`, so the client
# is ready before the TypeScript build (which imports its generated types) runs.
RUN npm ci

COPY server/tsconfig.json ./server/tsconfig.json
COPY server/src ./server/src
RUN npm run build --workspace server

# --- Runtime stage -------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY server/prisma ./server/prisma
RUN npm ci --omit=dev

COPY --from=builder /app/server/dist ./server/dist

EXPOSE 4000

# Applies any pending migrations, then starts the API. Safe to run on every
# boot: `prisma migrate deploy` is a no-op when the schema is already current.
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node dist/index.js"]
