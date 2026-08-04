# Codex Repository Instructions

## Publishing to GitHub

Do not run `git push` directly for source changes. Every Codex-to-GitHub synchronization must use the versioned release command:

```bash
pnpm release:sync -- --type <type> --message "<description>" [release options]
```

Choose a Conventional Commit type: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, or `chore`.

- Use `--breaking`, `--database-change`, `--architecture-change`, `--framework-change`, or `--api-breaking` for a Major release.
- A `feat` produces a Minor release unless a Major flag is present.
- All other supported types produce a Patch release unless `--bump` explicitly overrides it.
- Add `--known-issue`, `--feature`, `--fixed`, `--optimization`, `--improvement`, and `--documentation` entries as needed.
- Database changes require `--database-change`; the release command must create a Migration Guide.
- Never bypass a failed validation or include secrets in a commit.

For the first commit of an empty repository, use `--bootstrap`. For local preparation without GitHub push, use `--no-push`. Use `--dry-run` to inspect the planned version safely.

## Mandatory Application Architecture

All changes must preserve this application boundary:

- **Frontend:** Next.js App Router with React and TypeScript.
- **Backend:** ASP.NET Core Web API.
- **Backend framework target:** .NET 10 (`net10.0`) using `Microsoft.NET.Sdk.Web`.

Do not introduce another production frontend framework or a second production
backend stack. In particular, do not add PHP, Node.js/Express, or Next.js Route
Handlers as replacements for the ASP.NET Core domain API. Existing PHP-shaped
compatibility URLs (`/api.php` and `/sse.php`) may remain only as adapters that
are implemented by and forwarded to the .NET Web API during migration.

### Frontend Rules

- Put application routes, layouts, components, loading states, and error states
  under `app/` and follow the installed Next.js App Router documentation in
  `node_modules/next/dist/docs/`.
- Use Server Components by default. Add `"use client"` only to the smallest
  interactive boundary that needs browser APIs, state, effects, or event
  handlers.
- New frontend code must use TypeScript with the repository's strict settings.
  Do not expand the legacy global-script architecture for new features.
- Access business data through the same-origin `/api/*` contract. Keep the
  `BACKEND_ORIGIN` rewrite boundary in `next.config.mjs`; never expose backend
  secrets or infrastructure credentials to browser code.
- Every user-facing page must provide useful loading, empty, offline, and error
  states. An unavailable backend must not produce a blank screen.
- UI changes must work across mobile, tablet, desktop, and wide-screen
  resolutions and must preserve keyboard and semantic accessibility.
- If an unavoidable compatibility fix changes `app.js`, apply the identical
  change to `public/legacy-app.js` until the legacy dashboard is fully migrated.

### Backend Rules

- Keep production API code under `backend/` and keep the project target at
  `net10.0` unless an explicitly approved framework migration is requested.
- Implement domain behavior, persistence, validation, telemetry, and external
  integrations in ASP.NET Core services and endpoints, not in the Next.js
  frontend.
- Prefer asynchronous APIs with `CancellationToken`, typed request/response
  contracts, dependency injection, nullable reference types, and structured
  error responses with appropriate HTTP status codes.
- Keep public endpoints under `/api/*`. Compatibility endpoints must delegate
  to the same backend behavior and must not become a parallel API design.
- Validate all external input, avoid returning secrets or internal exception
  details, and never commit credentials. Production CORS must be restricted to
  explicitly approved origins.
- Schema or persisted-data changes require `--database-change`, a migration
  guide, and a documented backup/rollback path.

### Required Validation

Before a frontend or full-stack change is considered complete, run:

```bash
pnpm check
pnpm test
pnpm build
```

Before a backend or full-stack change is considered complete, also run:

```bash
dotnet build backend/PredictaCore.Api.csproj
```

When runtime behavior changes, verify `/api/health` and the affected API/UI
flow. Do not report validation as passing when a required runtime or SDK is
missing; state the exact unverified check instead.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
