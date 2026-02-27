# Segur Backend — AI Agent Instructions

> **IMPORTANT**: Any architectural change to this project MUST be reflected back into both this file and `README.md` to keep them in sync.

## Tech Stack

- **Runtime**: Bun (NOT Node.js)
- **Framework**: ElysiaJS
- **Validation**: Zod (via Elysia's Standard Schema support). Do NOT use Elysia.t / TypeBox.
- **OpenAPI**: `@elysiajs/openapi` with Scalar UI at `/openapi`
- **Database**: PostgreSQL + Prisma ORM (Rust-free engine, `prisma-client` generator, `@prisma/adapter-pg`)
- **Testing**: `bun test` (Bun's native test runner)
- **Linting/Formatting**: Biome v2

## Strict Rules

### Dependencies
- ALL dependencies MUST use exact versions (no `^`, no `~`, no `*`).
- Use `bun add --exact` or `bun add -d --exact` for every install.
- TypeScript is pinned to `5.9.3`.

### Imports
- NEVER use `.js` extensions on imports. Bun resolves TypeScript natively.
- Use `@/` path alias for all imports from `src/` (e.g. `import { envPlugin } from '@/config/env'`).
- Relative imports are allowed ONLY within the same module (e.g. `../domain/entities`).

### No Barrel Exports
- NEVER create `index.ts` barrel/re-export files. Biome enforces `noBarrelFile: error`.
- Always import directly from the specific file.

### Elysia Plugin Naming
- All Elysia plugin instances MUST use the naming convention: `@app/[module]/[name]`
- Examples: `@app/config/env`, `@app/config/db`, `@app/modules/health`, `@app/shared/response`

### Response Shape
- ALL API endpoints MUST return the standard `ApiResponse<T>` shape:
  ```
  { data?: T, success: boolean, message?: string, meta?: { pagination?: PaginationInfo } }
  ```
- Use the response helpers from `baseController`: `jsonOk(data)`, `jsonOk(data, message)`, `jsonOkNoData(message)`, `jsonPaginated(data, pagination)`, `jsonError(code, message)`
- The error handler also returns this shape on failures.

### Base Controller
- Every module controller MUST `.use(baseController)` to inherit shared infrastructure (env, db, error handler, response helpers).
- The `baseController` is at `src/shared/base-controller.ts`.

## Architecture: Clean Architecture (Feature-First)

Dependencies point inward: Domain → Application → Infrastructure → Presentation.

### Module Structure
Each feature module lives in `src/modules/[feature]/` with 4 layers:
- `domain/` — entities (interfaces/types), repository interfaces (ports). NO framework imports.
- `application/` — services (use cases). Depends ONLY on domain. NO Elysia, NO Prisma.
- `infrastructure/` — Prisma repository implementations (adapters). Implements domain interfaces.
- `presentation/` — Elysia controller (routes + validation), Zod schemas. Uses `baseController`.

### Shared Layer
- `src/shared/domain/` — shared error classes, value objects, branded IDs (one class per file)
- `src/shared/middleware/` — error handler, auth guards, logger
- `src/shared/utils/` — response helpers, pagination utilities

### Config Layer
- `src/config/env.ts` — Zod-validated env vars, exposed as Elysia plugin
- `src/config/database.ts` — PrismaClient singleton with `@prisma/adapter-pg`

### API Versioning
- `src/api/v1.ts` — mounts all v1 module controllers under `/api/v1` prefix
- New versions are separate files (e.g. `v2.ts`) sharing domain/application layers

## File Conventions
- One class/concern per file
- Kebab-case filenames (e.g. `app-error.ts`, `prisma-repo.ts`, `base-controller.ts`)
- Zod schemas live in `presentation/schemas.ts` of each module
- Use `type` keyword for type-only imports (`import type { ... }`)

## Testing
- Unit tests: `tests/unit/` — test services with mocked repositories
- Integration tests: `tests/integration/` — test Prisma repos against Docker PostgreSQL
- E2E tests: `tests/e2e/` — test full request cycle via `app.handle(new Request(...))`

## Commands
- `bun run dev` — start with watch mode
- `bun run lint` / `bun run lint:fix` — Biome check
- `bun run format` — Biome format
- `bun test` — run all tests
- `bun run db:generate` — generate Prisma client
- `bun run db:migrate` — run Prisma migrations
