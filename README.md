# Vitals API Service

A production-oriented backend service for managing a **waitlist** and **contact form** system. Built with a clean layered architecture, modern tooling, and scalability baked in from day one.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run database migrations
npm run prisma:migrate

# 5. Start the development server
npm run dev
```

**Swagger docs:** `http://localhost:3000/api/docs`

> Make sure your `.env` is configured with valid Neon, Brevo, and Upstash credentials before running migrations or starting the server.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Diagram](#system-diagram)
- [Architecture Philosophy](#architecture-philosophy)
- [Project Structure](#project-structure)
- [How the Layers Interact](#how-the-layers-interact)
- [Module Breakdown](#module-breakdown)
- [Email System Design](#email-system-design)
- [Rate Limiting Strategy](#rate-limiting-strategy)
- [Waitlist Analytics](#waitlist-analytics)
- [Security Considerations](#security-considerations)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Standard Response Shape](#standard-response-shape)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Scalability Path](#scalability-path)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Overview

This service powers two core user-facing flows:

1. **Waitlist** — Lets users sign up to be notified when the product launches. Signups are persisted in a PostgreSQL database, synced into Brevo contact lists for campaign readiness, and confirmed by email.
2. **Contact Form** — Lets users send inquiries. Messages are persisted, the user receives an auto-reply, and the admin receives a formatted notification with a `Reply-To` header so replies go directly to the original sender.

Both flows are protected with Redis-backed rate limiting, validated with Zod, and documented in Swagger.

---

## Tech Stack

| Layer            | Technology                     | Why                                                                 |
|-----------------|-------------------------------|----------------------------------------------------------------------|
| Runtime          | Node.js + TypeScript           | Type safety, modern async patterns                                   |
| Framework        | Express v5                     | Lightweight, flexible, industry standard                            |
| Database         | PostgreSQL via Neon             | Managed, scalable, no infra overhead                                 |
| ORM              | Prisma v5                      | Type-safe queries, clean migrations, excellent DX                    |
| Email            | Brevo (HTTP API)               | Free tier without expiry, supports transactional + campaigns         |
| Rate Limiting    | Upstash Redis                  | Serverless Redis, connectionless, purpose-built for rate limiting     |
| Validation       | Zod                            | Schema-first, composable, TypeScript-native                          |
| API Docs         | Swagger UI + swagger-jsdoc     | Interactive documentation, useful for testing and handoff            |
| Security         | Helmet + CORS                  | Standard hardening middleware                                        |
| Logging          | Custom structured logger       | Timestamp + level + metadata, extensible later                       |

---

## System Diagram

```
                         ┌─────────────────────────────────────┐
                         │           Client / Frontend          │
                         └──────────────┬──────────────────────┘
                                        │ HTTP Request
                         ┌──────────────▼──────────────────────┐
                         │          Express API Server          │
                         │                                      │
                         │  Route → Middleware → Controller     │
                         │               │                      │
                         │           Service                    │
                         │               │                      │
                         │          Repository                  │
                         └──────────────┬──────────────────────┘
                                        │
              ┌─────────────────────────┼──────────────────────────┐
              │                         │                           │
  ┌───────────▼────────┐   ┌────────────▼──────────┐  ┌────────────▼──────────┐
  │  Neon PostgreSQL   │   │   Upstash Redis        │  │   Brevo Email API     │
  │  (persistent data) │   │   (rate limiting)      │  │   (notifications)     │
  └────────────────────┘   └───────────────────────┘  └───────────────────────┘
                                                                │
                                                  ┌─────────────▼─────────────┐
                                                  │   Brevo Contact Lists      │
                                                  │   (campaign readiness)     │
                                                  └───────────────────────────┘
```

Every inbound request passes through rate limiting before touching business logic. Data is always persisted to the database first — email delivery is a non-blocking side effect.

---

## Architecture Philosophy

This project follows a strict **layered architecture** pattern:

```
Request
  ↓
Route            → defines endpoint and applies middleware
  ↓
Middleware        → rate limiting, logging
  ↓
Controller        → handles HTTP (req/res only)
  ↓
Service           → owns business logic
  ↓
Repository        → owns database queries only
  ↓
Database          → Prisma + Neon PostgreSQL
       ↘
    External systems (Brevo email, Upstash Redis) ← called from Service layer
```

### Why this separation matters

| Layer       | Responsibility                        | What it does NOT do                         |
|------------|--------------------------------------|---------------------------------------------|
| Controller  | Parse request, call service, respond  | No business logic, no DB queries            |
| Service     | Business rules, side effects          | No HTTP logic, no raw SQL                   |
| Repository  | DB queries only                       | No business logic, no email calls           |
| Middleware  | Cross-cutting concerns                | No business logic                           |

This means:
- You can swap the database without touching controllers
- You can change email providers without touching business logic
- You can test services independently without HTTP
- New features follow the same pattern, so the codebase stays consistent

---

## Project Structure

```
vitals_api_service/
│
├── prisma/
│   ├── schema.prisma              # DB models and data shape
│   └── migrations/                # Migration history (auto-generated)
│
├── src/
│   ├── app.ts                     # Express app: middleware wiring, routes, error handlers
│   ├── server.ts                  # Server bootstrap: listen on port
│   │
│   ├── config/
│   │   ├── env.ts                 # Zod-validated environment variables
│   │   ├── logger.ts              # Structured logging utility
│   │   └── swagger.ts             # OpenAPI spec builder
│   │
│   ├── routes/
│   │   ├── index.ts               # Aggregates all module routes
│   │   └── health.route.ts        # Health check + temporary admin endpoints
│   │
│   ├── modules/
│   │   │
│   │   ├── waitlist/              # Waitlist feature module (self-contained)
│   │   │   ├── waitlist.route.ts              # Registers POST / and GET /stats
│   │   │   ├── waitlist.controller.ts         # HTTP layer for waitlist
│   │   │   ├── waitlist.service.ts            # Signup logic, dedup, email trigger
│   │   │   ├── waitlist.repository.ts         # DB queries: create, findByEmail, counts
│   │   │   ├── waitlist.validation.ts         # Zod schema for input
│   │   │   ├── waitlist.types.ts              # TypeScript interfaces
│   │   │   ├── waitlist.docs.ts               # Swagger path definitions
│   │   │   ├── waitlist-stats.service.ts      # Count queries for analytics
│   │   │   └── waitlist-stats.controller.ts   # GET /stats endpoint handler
│   │   │
│   │   └── contact/               # Contact form feature module (self-contained)
│   │       ├── contact.route.ts               # Registers POST /
│   │       ├── contact.controller.ts          # HTTP layer for contact
│   │       ├── contact.service.ts             # Save + notify admin + confirm user
│   │       ├── contact.repository.ts          # DB queries: create
│   │       ├── contact.validation.ts          # Zod schema for input
│   │       ├── contact.types.ts               # TypeScript interfaces
│   │       └── contact.docs.ts                # Swagger path definitions
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── error.middleware.ts            # Global error handler
│   │   │   ├── notFound.middleware.ts         # 404 fallback
│   │   │   ├── rateLimit.middleware.ts        # Upstash-backed rate limiter
│   │   │   └── requestLogger.middleware.ts    # Logs method, path, status, duration
│   │   │
│   │   ├── services/
│   │   │   ├── email.service.ts               # Sends transactional emails via Brevo HTTP API
│   │   │   ├── brevo-contact.service.ts       # Syncs waitlist users to Brevo contact list
│   │   │   └── waitlist-summary.service.ts    # Sends daily waitlist summary to admin
│   │   │
│   │   ├── utils/
│   │   │   ├── api-response.ts                # Standardised success/error response shape
│   │   │   ├── async-handler.ts               # Wraps async controllers for error propagation
│   │   │   ├── escape-html.ts                 # Sanitises user content before HTML injection
│   │   │   ├── normalize-email.ts             # Lowercases + trims email addresses
│   │   │   └── get-client-ip.ts               # Extracts real IP (handles proxies/forwarding)
│   │   │
│   │   └── errors/
│   │       ├── app.error.ts                   # Base custom error with statusCode
│   │       ├── bad-request.error.ts           # 400 errors
│   │       ├── too-many-requests.error.ts     # 429 errors
│   │       └── internal-server.error.ts       # 500 errors
│   │
│   └── infrastructure/
│       ├── database/
│       │   └── prisma.ts                      # Prisma client singleton (prevents hot-reload leaks)
│       ├── redis/
│       │   └── redis.ts                       # Upstash Redis client
│       └── email/
│           └── brevo.ts                       # Brevo SDK bootstrap (or unused if using HTTP directly)
│
├── .env                           # Local environment variables (never commit this)
├── .env.example                   # Example env file (safe to commit)
├── package.json
├── tsconfig.json
└── README.md
```

---

## How the Layers Interact

### Waitlist Signup (Full Flow)

```
POST /api/waitlist
  ↓
rateLimitMiddleware("waitlist")        → Upstash Redis: check IP counter
  ↓
waitlist.controller.ts                 → parse + validate req.body via Zod
  ↓
waitlist.service.ts
  ├── normalizeEmail()                 → lowercase + trim
  ├── waitlistRepository.findByEmail() → check for duplicate
  ├── (if new) waitlistRepository.create()
  ├── syncWaitlistContactToBrevo()     → POST to Brevo /v3/contacts
  └── sendUserConfirmation()           → POST to Brevo /v3/smtp/email
  ↓
201 Created                            → { success, message, data }
```

### Contact Form Submission (Full Flow)

```
POST /api/contact
  ↓
rateLimitMiddleware("contact")         → Upstash Redis: check IP counter
  ↓
contact.controller.ts                  → parse + validate req.body via Zod
  ↓
contact.service.ts
  ├── normalizeEmail()
  ├── contactRepository.create()
  ├── sendAdminNotification()          → POST to Brevo, Reply-To = submitter's email
  └── sendUserConfirmation()           → POST to Brevo, confirms receipt
  ↓
201 Created                            → { success, message, data }
```

### Admin Reply Flow

When the admin receives a contact notification email and clicks **Reply** in Gmail:

```
Admin clicks Reply in Gmail
  ↓
Gmail reads Reply-To header = user's email
  ↓
Reply goes directly to the user who submitted the form
```

This works because the `Reply-To` header is set by the backend when sending the admin notification. No additional routing or forwarding infrastructure is needed.

---

## Module Breakdown

### `modules/waitlist/`

Everything related to waitlist signups lives here and is self-contained.

- **`waitlist.validation.ts`** — Zod schema enforcing email format, optional name with length limits
- **`waitlist.repository.ts`** — All Prisma queries: `findByEmail`, `create`, `countAll`, `countCreatedBetween`
- **`waitlist.service.ts`** — Core logic: deduplication check, DB write, Brevo sync, user confirmation
- **`waitlist-stats.service.ts`** — Aggregates counts from the repository for the stats endpoint
- **`waitlist.docs.ts`** — Swagger path definitions merged into the OpenAPI spec

### `modules/contact/`

Everything related to contact form submissions lives here and is self-contained.

- **`contact.validation.ts`** — Zod schema enforcing name, email, subject, and message with character limits
- **`contact.repository.ts`** — Single Prisma `create` query
- **`contact.service.ts`** — Core logic: DB write, admin notification with `replyTo`, user confirmation
- **`contact.docs.ts`** — Swagger path definitions

### `shared/`

Code that is not owned by any one module but is used across them.

- **`email.service.ts`** — A single `sendEmail()` abstraction over Brevo's HTTP API. All email calls go through this. To swap providers in future, only this file changes.
- **`brevo-contact.service.ts`** — Handles syncing a contact into a Brevo list using `updateEnabled: true` (idempotent — safe to call multiple times for the same email).
- **`waitlist-summary.service.ts`** — Fetches daily + total counts and emails a summary to the admin. Designed to be triggered by a cron job in production.
- **`rateLimit.middleware.ts`** — Thin middleware that calls Upstash and writes `X-RateLimit-*` headers. Takes a `"waitlist"` or `"contact"` string to select the right rate limiter instance.
- **`escape-html.ts`** — Escapes `&`, `<`, `>`, `"`, `'` before injecting user content into HTML email bodies. Prevents XSS via email clients.
- **`api-response.ts`** — Ensures every response has a consistent shape: `{ success, message, data? }`. This makes frontend integration predictable.
- **`async-handler.ts`** — Wraps async Express handlers so thrown errors propagate to `error.middleware.ts` without try/catch boilerplate in every controller.

### `infrastructure/`

External system clients. Isolated here so swapping a provider means changing one file.

- **`prisma.ts`** — Singleton pattern: reuses one `PrismaClient` instance across the app, avoids connection leaks during hot reload in development
- **`redis.ts`** — Upstash Redis client initialised with REST URL + token
- **`brevo.ts`** — Brevo SDK setup (if using the SDK; currently email is sent via raw HTTP `fetch` to avoid SDK version mismatch issues)

---

## Email System Design

### Two email roles

| Role                  | Trigger                    | Recipient         | Content                                     |
|-----------------------|---------------------------|------------------|----------------------------------------------|
| User confirmation     | Waitlist signup           | Submitter         | "You're on the waitlist 🎉"                   |
| User confirmation     | Contact submission        | Submitter         | "We received your message"                   |
| Admin notification    | Contact submission only   | Admin inbox       | Full message + Reply-To = submitter's email  |
| Daily summary         | Cron / manual trigger     | Admin inbox       | Signups today + total signups                |

### Why no per-signup admin email for waitlist?

Sending an admin notification for every waitlist signup would create inbox noise as the list grows. Since all entries are persisted in the database and a summary endpoint exists, the admin has better visibility through:
- `GET /api/waitlist/stats` for real-time counts
- Daily summary email for an at-a-glance digest

### Campaign emails (product launch, announcements)

These are **not** sent from the backend. Instead:

1. Each waitlist signup is automatically synced to a **Brevo contact list** via `brevo-contact.service.ts`
2. When the product launches, the admin creates a campaign in the Brevo dashboard and sends it to that list

This cleanly separates **transactional email** (backend) from **marketing email** (Brevo campaigns), which is the correct production pattern.

### HTML safety

User-submitted content (name, email, subject, message) is passed through `escapeHtml()` before being embedded into HTML email bodies. This prevents injected HTML/JavaScript from rendering in email clients.

---

## Rate Limiting Strategy

Rate limiting is implemented using **Upstash Redis** with the `@upstash/ratelimit` package and a **fixed window** algorithm.

| Endpoint        | Limit          | Window     | Key          |
|----------------|---------------|------------|--------------|
| `POST /waitlist` | 5 requests     | Per hour   | `waitlist:ip:{ip}` |
| `POST /contact`  | 3 requests     | Per 10 min | `contact:ip:{ip}`  |

Rate limit headers returned on every request:
```
X-RateLimit-Limit     → max requests allowed
X-RateLimit-Remaining → requests remaining in current window
X-RateLimit-Reset     → timestamp when the window resets
```

When the limit is exceeded, the API returns:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```
with HTTP status `429`.

### Why Upstash Redis instead of in-memory?

In-memory rate limiting resets when the server restarts and does not work across multiple server instances. Upstash Redis is:
- Persistent across restarts
- Shared across instances (important when scaling horizontally)
- Serverless-friendly with no persistent TCP connection requirement
- Zero infrastructure setup — managed cloud Redis

---

## Waitlist Analytics

```
GET /api/waitlist/stats
```

Returns:
```json
{
  "success": true,
  "message": "Waitlist stats fetched successfully.",
  "data": {
    "totalSignups": 120,
    "signupsToday": 8
  }
}
```

**How it works:**
- `totalSignups` → `prisma.waitlistEntry.count()`
- `signupsToday` → `prisma.waitlistEntry.count({ where: { createdAt: { gte: startOfToday } } })`

Both run in parallel using `Promise.all()` to minimise latency.

> **Note:** In production, this endpoint should be protected behind admin authentication.

---

## Security Considerations

| Concern                    | How it's handled                                                    |
|---------------------------|---------------------------------------------------------------------|
| Input validation           | Zod schemas on every request body                                  |
| HTML injection in emails   | `escapeHtml()` applied to all user-provided fields before rendering|
| Spam / abuse               | Redis-backed rate limiting per IP                                  |
| Error exposure             | Generic messages returned to clients; full errors logged server-side|
| HTTP header hardening      | Helmet middleware applied globally                                  |
| CORS                       | Enabled via `cors` middleware                                       |
| Env variable safety        | All env vars parsed and validated at startup via Zod               |
| SQL injection              | Prisma parameterised queries — no raw SQL                          |

---

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000

# Database (Neon PostgreSQL)
DATABASE_URL=your_neon_connection_string

# Brevo (Email)
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=yoursender@gmail.com
BREVO_FROM_NAME=Vitals
BREVO_WAITLIST_LIST_ID=your_brevo_list_id

# Admin inbox
ADMIN_EMAIL=youradmin@gmail.com

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

All variables are validated at startup using Zod. If any are missing or malformed, the server will refuse to start and print which variables failed.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Brevo](https://brevo.com) account (free tier)
- An [Upstash](https://upstash.com) Redis database (free tier)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### Useful Scripts

```bash
npm run dev              # Start with hot reload (ts-node-dev)
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled output
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Apply pending migrations
npm run prisma:studio    # Open Prisma Studio (visual DB browser)
```

---

## API Documentation

Interactive Swagger docs are available at:

```
http://localhost:3000/api/docs
```

### Endpoints Summary

| Method | Path                    | Description                            |
|--------|------------------------|----------------------------------------|
| GET    | `/api/health`           | Health check                           |
| POST   | `/api/waitlist`         | Add a user to the waitlist             |
| GET    | `/api/waitlist/stats`   | Get total and today's signup counts    |
| POST   | `/api/contact`          | Submit a contact form message          |

---

## Standard Response Shape

Every endpoint in this API returns the same consistent JSON envelope:

**Success:**
```json
{
  "success": true,
  "message": "Human-readable description of the result.",
  "data": {
    "id": "22621972-779e-4dbb-b122-b161c172310e",
    "email": "user@example.com",
    "name": "Joseph Ige",
    "createdAt": "2026-04-17T09:36:07.000Z"
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": ["A valid email is required"]
  }
}
```

**Rate limited (429):**
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

This shape is enforced by `shared/utils/api-response.ts` and used consistently across all controllers. Frontends can always check `success: boolean` without parsing message strings.

---

## Key Architectural Decisions

### 1. Why a repository layer if Prisma is already an abstraction?

Prisma is a DB client, not a data access pattern. The repository layer:
- Keeps all query logic in one place per model
- Makes services easier to unit test (you can mock the repository)
- Enforces a rule: services never write Prisma queries directly

### 2. Why Brevo HTTP API instead of the SDK?

During development, the `@getbrevo/brevo` SDK had version instability (constructor mismatches across SDK versions). Using Brevo's documented REST API directly via `fetch` is:
- More predictable
- Easier to debug
- Not dependent on SDK release cycles
- Equally straightforward for the operations we need

If the SDK stabilises, switching is a one-file change in `email.service.ts`.

### 3. Why Upstash for rate limiting and not in-memory?

In-memory rate limiting (e.g. `express-rate-limit` with in-memory store) resets on server restart and breaks with horizontal scaling. Upstash:
- Persists across restarts
- Works correctly with multiple instances
- Is connectionless (no persistent socket), which is compatible with serverless/edge deployments
- Has a free tier sufficient for this project's needs

### 4. Why separate transactional email from campaign email?

Transactional emails (confirmations, notifications) are sent immediately in response to user actions — they should be fast, reliable, and minimal. Campaign emails (launch announcements, newsletters) are sent in bulk on a schedule.

Mixing them creates problems: campaign bursts can interfere with daily sending limits, and transactional logic should not depend on campaign infrastructure.

This project keeps them cleanly separated:
- Backend → transactional
- Brevo dashboard → campaigns to contact lists

### 5. Why `updateEnabled: true` in Brevo contact sync?

When syncing a waitlist user to a Brevo contact list, using `updateEnabled: true` makes the operation **idempotent** — safe to call multiple times without failing if the contact already exists. This prevents errors during retries, re-testing, or edge cases where the same email is submitted again.

### 6. Why `escapeHtml()` before email rendering?

User-submitted content is embedded directly into HTML email bodies. Without escaping, a user could submit content like `<script>` or `</div><h1>hacked</h1>` and corrupt the email layout or trigger rendering behaviour in some email clients. Escaping `&`, `<`, `>`, `"`, and `'` prevents this.

### 7. Why Prisma v5 and not v7?

Prisma v7 introduced a required driver adapter for all database connections, adding significant setup complexity (adapter packages, different client instantiation patterns). For this project's scope, Prisma v5 provides identical functionality without the extra overhead.

---

## Scalability Path

This project is designed to evolve in clear stages:

### Stage 1 — Current (MVP)

- Transactional emails via Brevo HTTP API
- Redis rate limiting via Upstash
- PostgreSQL via Neon
- Manual daily summary via endpoint trigger

### Stage 2 — Growth

- Add admin authentication to protect `/stats` and `/waitlist-summary`
- Replace manual summary trigger with a cron job (e.g. GitHub Actions on a schedule, or a BullMQ scheduler)
- Add domain authentication (SPF + DKIM) in Brevo for better email deliverability

### Stage 3 — Scale

- Add email queuing (BullMQ + Redis) to decouple email sending from request lifecycle
- Add pagination and filtering to waitlist admin endpoints
- Add support ticket status management for contact messages
- Add soft-delete or archiving for handled contact messages

---

## Future Improvements

- [ ] Admin authentication (JWT or API key) on protected endpoints
- [ ] Cron-based daily waitlist summary (replace manual endpoint)
- [ ] Email queue / background worker (decouple sends from HTTP cycle)
- [ ] Domain authentication (SPF + DKIM via Brevo) for production deliverability
- [ ] Contact message status management (`new` → `reviewed` → `replied`)
- [ ] Pagination on waitlist data
- [ ] Double opt-in for waitlist (more compliant for GDPR regions)
- [ ] Webhook endpoint for Brevo delivery/bounce events
- [ ] Test coverage (unit + integration)

---

## Author

**Joseph Ige**

This project was built to demonstrate production-oriented backend thinking — not just "making endpoints work", but designing systems that are:

- **Correct** — validated input, safe output, consistent responses
- **Resilient** — email failures never break API responses; data is saved first
- **Scalable** — layered architecture, managed infra, campaign-ready email pipeline
- **Maintainable** — each module is self-contained and follows the same pattern

The goal was to build something a real team could pick up, understand, and extend without needing a walkthrough.

---

## Notes

- The `X-RateLimit-Reset` header returns a Unix timestamp (milliseconds). Clients can use this to display countdown timers.
- The `/api/waitlist/stats` endpoint is currently public. In production, it should be protected.
- All emails fail silently on the server side (logged but not thrown) so that email delivery failures never cause API request failures. The core data is always saved to the database first.
- Prisma's singleton pattern in `prisma.ts` prevents hot-reload in development from opening multiple database connections.