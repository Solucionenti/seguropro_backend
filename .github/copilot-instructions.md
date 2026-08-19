# Segur Backend — AI Agent Instructions

> **IMPORTANT**: Any architectural change to this project MUST be reflected back into both this file and `README.md` to keep them in sync.

## Tech Stack

- **Runtime**: Bun (NOT Node.js)
- **Framework**: ElysiaJS
- **Validation**: Zod (via Elysia's Standard Schema support). Do NOT use Elysia.t / TypeBox.
- **OpenAPI**: `@elysiajs/openapi` with Scalar UI at `/openapi`
- **Database**: PostgreSQL + Prisma ORM (Rust-free engine, `prisma-client` generator, `@prisma/adapter-pg`)
- **JWT**: `jose` library (direct dependency). Do NOT use `@elysiajs/jwt` — it couples JWT logic to Elysia context and breaks clean architecture.
- **Email**: Resend HTTP API called with plain `fetch`. Do NOT install the `resend` SDK — it is a thin wrapper over the same endpoint.
- **Email templates**: React Email (`@react-email/components` + `@react-email/render`, `react`). Templates are `.tsx` files under `src/shared/infrastructure/emails/`. `tsconfig.json` sets `jsx: react-jsx` and includes `src/**/*.tsx`.
- **Testing**: `bun test` (Bun's native test runner)
- **Linting/Formatting**: Biome v2

## Strict Rules

### Dependencies
- ALL dependencies MUST use exact versions (no `^`, no `~`, no `*`).
- Use `bun add --exact` or `bun add -d --exact` for every install.
- TypeScript is pinned to `5.9.3`.

### Imports
- NEVER use `.js` extensions on imports. Bun resolves TypeScript natively.
- Use `@/` path alias for all imports from `src/` (e.g. `import { envConfig } from '@/config/env'`).
- Use `@gen/` path alias for imports from `generated/prisma/` (e.g. `import { UserRole } from '@gen/enums'`).
- Relative imports are allowed ONLY within the same module (e.g. `../domain/entities`).

### No Barrel Exports
- NEVER create `index.ts` barrel/re-export files. Biome enforces `noBarrelFile: error`.
- Always import directly from the specific file.

### Elysia Plugin Naming
- All Elysia plugin instances MUST use the naming convention: `@app/[module]/[name]`
- Examples: `@app/config/db`, `@app/modules/health`, `@app/shared/response`

### Error Handler
- `errorHandler` (`src/shared/middleware/error-handler.ts`) MUST register its `onError` with `{ as: 'global' }` — signature is `.onError({ as: 'global' }, handler)`. Elysia plugin hooks are **local** by default: without it the handler silently never runs, and every `AppError` (401/403/404) leaks as raw text with status 500.
- Because it is global, the hook also receives Elysia's own errors (`NOT_FOUND`, `VALIDATION`, `PARSE`, `INVALID_COOKIE_SIGNATURE`). Map each to its real status code — never collapse them into 500.
- `tests/e2e/error-shape.test.ts` guards both behaviors. Do not delete it.

### Response Shape
- ALL API endpoints MUST return the standard `ApiResponse<T>` shape:
  ```
  { data?: T, success: boolean, message?: string, meta?: { pagination?: PaginationInfo } }
  ```
- Use the response helpers: `jsonOk(data)`, `jsonOk(data, message)`, `jsonOkNoData(message)`, `jsonPaginated(data, total, page, pageSize)`, `jsonError(code, message)`
- ALL handler functions MUST destructure and use these helpers. NEVER return raw objects.
- Response helpers are static pure functions registered via `.decorate()` (NOT `.derive()`), since they have no per-request state.
- The error handler also returns this shape on failures.

### Validation (CRITICAL — No Double Parsing)
- Zod schemas are passed to Elysia route options (e.g. `{ body: loginSchema }`). Elysia validates automatically via Standard Schema.
- **NEVER** call `.parse()` / `.safeParse()` inside handlers. The `body`/`query`/`params` are already validated and typed by Elysia.
- Handlers receive the validated, typed data directly (e.g. `({ body }) => body.email`).

### Routers: `publicRouter` and `authRouter`
- Two base routers live in `src/shared/routers/`:
  - **`publicRouter`** (`src/shared/routers/public-router.ts`): Composes `dbPlugin` + `errorHandler` + `responsePlugin` + `paginated` macro. For public (unauthenticated) endpoints.
  - **`authRouter`** (`src/shared/routers/auth-router.ts`): Inherits `publicRouter` + `jwtServicePlugin` + resolves the authenticated user (`userId`, `userRole`, `companyId`) from the Bearer token or throws `UnauthorizedError`. For protected endpoints.
- Both routers use `.as('scoped')` so their context propagates to consuming controllers.
- There is NO separate `baseController`. The `publicRouter` IS the base — it provides db, error handling, response helpers, and pagination directly.
- Every module controller MUST `.use(publicRouter)` or `.use(authRouter)` depending on whether its routes are public or protected.
- If a controller has **both** public and protected routes, split into separate Elysia instances (e.g. `authPublicController` + `authProtectedController`) each using the appropriate router.
- Controllers MUST also `.use()` only the specific service plugins they need (e.g. `.use(authServicePlugin)`, `.use(userServicePlugin)`).
- **Destructure** services and response helpers directly in handler signatures (e.g. `({ body, authService, jsonOk })`).

### Macros
- **`paginated`** (defined in `publicRouter`): Named single macro using Elysia's `schema + resolve` pattern. When a route sets `{ paginated: true }`, the macro automatically adds the `paginationQuery` Zod schema to the route's `query` and resolves typed `page` and `pageSize` into the handler context. No need to manually add `query: paginationQuery` — the macro handles it.
- **`withRole`** (defined in `authRouter`): Accepts `UserRole | UserRole[]`. Runs a `beforeHandle` that checks the authenticated user's role from the JWT. Throws `ForbiddenError` (403) if the role doesn't match.
- **`requireCompany`** (defined in `authRouter`): Set `{ requireCompany: true }` on any tenant-scoped route. Runs a `resolve` that throws `ForbiddenError` (403) if `companyId` is `null` (i.e. the caller is a `MASTER_ADMIN`). Crucially, its return type narrows `companyId` from `string | null` to `string` in the handler context — no `as string` cast is ever needed. Always combine with `withRole: [UserRole.OWNER, UserRole.AGENT]` (or similar) for routes that require a company account.
- Pagination defaults and limits are configured via environment variables (`PAGINATION_DEFAULT_PAGE_SIZE`, `PAGINATION_MAX_PAGE_SIZE`) and consumed by the shared `paginationQuery` Zod schema in `src/shared/utils/pagination.ts`.

### Dependency Injection
- All services with real business logic MUST be **classes** implementing **interfaces** (ports). Dependencies injected via constructor.
- Anemic services (pure pass-through to repository with no logic) do NOT need interfaces — add the interface when the service gains real logic.
- **Interfaces (ports)**: `shared/domain/` for cross-cutting concerns, `modules/[feature]/domain/` for module-specific.
- **Implementations (adapters)**: `shared/infrastructure/` for cross-cutting, `modules/[feature]/infrastructure/` for module-specific.
- **Service wiring**: ALL service instantiation and DI wiring happens in `src/config/services.ts`.
- `services.ts` exports **per-module Elysia plugins** (e.g. `authServicePlugin`, `userServicePlugin`, `jwtServicePlugin`, `healthServicePlugin`). Each plugin decorates only its own service into context.
- **NEVER** create a monolithic plugin that decorates all services. Controllers must `.use()` only the service plugins they need.
- **NEVER** instantiate services or repositories inside controllers. Controllers receive services from their `.use()` plugins.
- No DI container — constructor injection wired in `services.ts`.

### Cross-Module Boundaries (CRITICAL)
- Modules MUST NOT import from other modules' domain, application, or infrastructure layers.
- If module A needs data that module B owns, module A MUST define its own port (interface) in `modules/A/domain/` describing only what it needs, and provide its own adapter in `modules/A/infrastructure/`.
- Example: Auth module needs user lookup → `AuthUserProvider` interface in `modules/auth/domain/`, `PrismaAuthUserProvider` adapter in `modules/auth/infrastructure/`. Auth NEVER imports from `modules/user/`.
- Shared interfaces in `src/shared/domain/` (e.g. `JwtService`, `PasswordHasher`) are the exception — they are cross-cutting concerns available to all modules.

### Prisma-Generated Types (Single Source of Truth)
- **NEVER** manually declare types that duplicate Prisma models or enums.
- Import enums directly from `@gen/enums` (e.g. `import { UserRole, ResourceStatus } from '@gen/enums'`). These are pure `as const` objects with zero Prisma runtime dependency.
- Use enum values in comparisons: `user.status !== ResourceStatus.ACTIVE`, NOT `user.status !== 'ACTIVE'`.
- Domain entity interfaces MUST use the Prisma enum types (e.g. `role: UserRole`), NOT generic `string`.
- **Domain types MUST derive from Prisma model types** using `Pick<ModelType, ...>` (e.g. `Pick<UserModel, 'firstName' | 'lastName' | 'email'>`) to avoid field redeclaration. Import model types from `@gen/models/ModelName`.
- Service input types (e.g. `CreateAdminInput`) MUST also use `Pick<ModelType, ...>` for Prisma-managed fields, adding non-Prisma fields (e.g. `password`) via intersection (`& { password: string }`).

### Entity Conventions
- ALL domain entities MUST extend `BaseEntity` from `src/shared/domain/base-entity.ts`.
- `BaseEntity` provides: `id: string`, `status: ResourceStatus`, `createdAt: Date`, `updatedAt: Date`.
- ALL Prisma models MUST include: `status ResourceStatus @default(ACTIVE)`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
- Use `@@map("table_name")` on every model to set the SQL table name (plural, snake_case).

### Prisma Global Omit
- The PrismaClient is configured with `omit: { user: { passwordHash: true } }` so `passwordHash` is excluded from all queries by default.
- When `passwordHash` IS needed (e.g. auth login), use `omit: { passwordHash: false }` at query level to override.
- The `User` domain entity does NOT include `passwordHash`. Repository `CreateUserInput` includes it for writes.

### Soft Deletion (CRITICAL)
- **By default, never** perform real deletion (DELETE) on any entity. ALL deletions MUST be soft: set `status = 'DELETED'`.
- Repository `delete` methods MUST be named `softDelete` and MUST only update `status` to `'DELETED'`.
- ALL read queries MUST filter by `status: 'ACTIVE'` by default. Use `findFirst` with `status: 'ACTIVE'` instead of `findUnique` where applicable.
- `ResourceStatus` enum values: `ACTIVE` (normal), `INACTIVE` (disabled but preserved), `DELETED` (soft-deleted).
- If a hard delete is truly needed (e.g. GDPR), it must be a separate, explicitly named method and requires explicit approval.
- Explicit feature exception: `ColumnaKanban` uses `hardDelete` and a physical DELETE endpoint; its foreign key sets related `Poliza.kanbanId` to `NULL` with `ON DELETE SET NULL`.

### Auth
- **JWT**: `jose` library via `JwtService` interface (`src/shared/domain/jwt-service.ts`) + `JoseJwtService` class (`src/shared/infrastructure/jose-jwt-service.ts`). Access + refresh token pair. JWT payload includes `sub`, `role`, and `companyId` for tenant isolation.
- **Password hashing**: `Bun.password` via `PasswordHasher` interface (`src/shared/domain/password-hasher.ts`) + `BunPasswordHasher` class (`src/shared/infrastructure/bun-password-hasher.ts`). Uses Argon2id.
- **Auth resolution**: `authRouter` (`src/shared/routers/auth-router.ts`) uses `.resolve()` to extract Bearer token, verify JWT, and attach `userId`, `userRole`, `companyId` to handler context. Throws `UnauthorizedError` on failure.
- **Role-based access**: `authRouter` provides a `withRole` macro. Use it in route options: `{ withRole: 'OWNER' }` or `{ withRole: ['OWNER', 'MASTER_ADMIN'] }`. Throws `ForbiddenError` (403) if the user's JWT role doesn't match. No DB check — role is trusted from the JWT.
- Protected controllers `.use(authRouter)` to get auth context automatically.

### Password Reset
- **Stateless**: there is NO `password_reset_tokens` table and no cleanup job. The reset token is a JWT signed with `JWT_SECRET`, TTL from `PASSWORD_RESET_EXPIRATION` (default `15m`).
- **Claims**: `sub` (userId), `typ: 'pwd_reset'`, `pwd` (SHA-256 fingerprint of the user's current `passwordHash`). The `typ` claim is what stops an access/refresh token being replayed as a reset token and vice versa — never drop it.
- **Single-use by construction**: saving the new password changes the hash, so the fingerprint no longer matches and the token stops validating. Do NOT add a "used" flag or table.
- **No `companyId` in the token**: `sub` already identifies exactly one user in exactly one company. Because the same email can exist in several companies, `POST /auth/forgot-password` sends ONE email per matching ACTIVE account, each carrying its own token.
- **No account enumeration**: `POST /auth/forgot-password` ALWAYS returns the same 200 response whether or not the email exists. Never branch the response on user existence.
- **Email boundary**: `EmailSender` port in `src/shared/domain/email-sender.ts`; `ResendEmailSender` (`src/shared/infrastructure/resend-email-sender.ts`) renders the React Email template and POSTs to `https://api.resend.com/emails`. The application layer passes plain data only — never HTML, never React.
- Sending is synchronous inside the request. Move to a queue only if request latency becomes a measured problem.

### Siniestros
- `clienteUserId` is ALWAYS derived from the poliza inside `SiniestroService.create`, never taken from the request body — the claim belongs to whoever owns the policy. `creadoPorUserId` comes from the JWT.
- `fechaEvento` MUST be inside the poliza coverage window (`fechaInicio..fechaVencimiento`) and MUST NOT be in the future.
- `companyId`, `polizaId` and `clienteUserId` are immutable after creation. CLIENT is read-only and scoped to their own polizas.

### Archivos de Poliza
- Only metadata is persisted (`nombre`, `mimeType`, `url`, `tamanoBytes`). Never store binaries in the DB — upload to the storage provider and send the `url`.
- The allowed `mimeType` allow-list lives in `ArchivoPolizaService` (application layer), not in the Zod schema.
- Access is scoped through the poliza and a foreign poliza yields `NotFoundError` (never `ForbiddenError`), so it is indistinguishable from a missing one.
- Nested routes are `/polizas/:id/archivos/:archivoId`. Keep the poliza segment named `:id` — Elysia's router demands the same parameter name at the same position and `polizaController` already uses `/polizas/:id`.

### Mi Empresa (RF-OWNER-09 / RF-OWNER-10)
- `GET/PUT /companies/mi-empresa` take the company from the JWT `companyId`, never from the URL or body — an OWNER structurally cannot reach another tenant. Never add an id param to these routes.
- `PUT` is a full replacement: `emailContacto` and `telefonoContacto` required, every other editable field nulled when omitted. Need a partial update? Add a separate `PATCH`, do not soften the `PUT`.
- `id`, `status` and the subscription are not editable here. An INACTIVE company is unreadable and therefore uneditable (`NotFoundError`).

### Multi-Tenant Model
- Each **Company (Empresa)** is an isolated tenant. All data queries must be scoped by `companyId`.
- Users are unique per company: `@@unique([companyId, email])`. The same email can exist in multiple companies.
- JWT tokens carry `companyId` for tenant isolation in every authenticated request.
- `MASTER_ADMIN` users have `companyId = null` and operate at platform level.
- Login flow: 1) `POST /auth/identify` with email → returns list of companies, 2) `POST /auth/login` with email + password + companyId → returns tokens.
- Use `{ requireCompany: true }` on every route that requires a non-null `companyId`. This throws `ForbiddenError` for `MASTER_ADMIN` callers and narrows the type to `string` — never cast `companyId as string` in handlers.

## Architecture: Clean Architecture (Feature-First)

Dependencies point inward: Domain → Application → Infrastructure → Presentation.

### Framework-Free Business Logic (CRITICAL)
- **ALL business logic MUST live in the `application/` layer (services), NEVER in Elysia controllers or plugins.**
- The `application/` layer MUST NOT import any framework code (no Elysia, no Prisma, no Zod). It depends ONLY on `domain/` interfaces.
- This ensures services are **unit-testable** with plain mocks — no HTTP server, no database, no framework context needed.
- Controllers (presentation layer) MUST be thin: destructure → call service → return response helper. No business logic.
- If you find yourself writing an `if` statement with business meaning inside a controller, move it to the service.

### Module Structure
Each feature module lives in `src/modules/[feature]/` with 4 layers:
- `domain/` — entities (interfaces/types derived via `Pick<PrismaModel, ...>`), repository interfaces (ports), service interfaces (for services with real logic). NO framework imports.
- `application/` — services (use cases). Depends ONLY on domain. NO Elysia, NO Prisma. Implements service interface from domain.
- `infrastructure/` — Prisma repository implementations (adapters). Implements domain interfaces.
- `presentation/` — Elysia controller (routes + validation), Zod schemas. Uses `publicRouter` or `authRouter`.

### Shared Layer
- `src/shared/domain/` — interfaces (ports), error classes, value objects (one per file)
- `src/shared/infrastructure/` — shared adapter implementations (e.g. `BunPasswordHasher`, `JoseJwtService`)
- `src/shared/middleware/` — Elysia plugins: error handler
- `src/shared/routers/` — `publicRouter` and `authRouter` (base Elysia instances for controllers)
- `src/shared/utils/` — response helpers, pagination utilities

### Config Layer
- `src/config/env.ts` — Zod-validated env vars exported as `envConfig` singleton (NOT an Elysia plugin)
- `src/config/database.ts` — PrismaClient singleton with `@prisma/adapter-pg` and global `omit`. Exports `AppPrismaClient` type (`typeof prisma`). **All repositories MUST import `AppPrismaClient` from `@/config/database`**, NEVER from the generated output directly. This ensures any extensions or middleware applied to the client are automatically reflected in all repositories.
- `src/config/services.ts` — All service/repository instantiation and DI wiring, exports per-module Elysia service plugins

### API Versioning
- `src/api/v1.ts` — mounts all v1 module controllers under `/api/v1` prefix
- New versions are separate files (e.g. `v2.ts`) sharing domain/application layers

## File Conventions
- One class/concern per file
- Kebab-case filenames (e.g. `app-error.ts`, `prisma-repo.ts`, `public-router.ts`)
- Zod schemas live in `presentation/schemas.ts` of each module
- Use `type` keyword for type-only imports (`import type { ... }`)
- Write as few comments as possible: only when the WHY is non-obvious, never restating the code
- Comments MUST be English, all lowercase, no trailing period — a short note, not prose
- Identifiers, types and helpers MUST be English. Only the insurance domain vocabulary already
  fixed in `prisma/schema.prisma` (`Poliza`, `Siniestro`, `Aseguradora`, `Ramo`, `montoEstimado`, …)
  stays in Spanish. Never mix a Spanish verb into a helper name

## Testing

### Principles
- **Business logic is testable without frameworks.** Because services depend only on domain interfaces (not Elysia or Prisma), they can be unit-tested with plain mock objects. This is enforced by the framework-free application layer rule above.
- **Test priority**: Unit tests (services) > E2E tests (critical paths) > Integration tests (repos).
- Every new service with business logic MUST have corresponding unit tests.

### Unit Tests (`tests/unit/`)
- Test services with **mocked** dependencies (repositories, hashers, JWT service).
- File structure mirrors source: `tests/unit/modules/[feature]/service.test.ts`
- **NO database, NO HTTP, NO framework context.** Instantiate the service class directly with mock implementations of its interfaces.
- Use `bun:test` (`describe`, `it`, `expect`, `mock`, `beforeEach`).
- Pattern:
  ```ts
  // 1. Create mock implementations of interfaces
  const mockRepo: MyRepository = {
    findById: mock(() => Promise.resolve(null)),
    // ... all interface methods
  }
  // 2. Instantiate service with mocks
  const service = new MyService(mockRepo)
  // 3. Test behavior, not implementation
  expect(result.status).toBe('ok')
  expect(mockRepo.findById).toHaveBeenCalledWith('id-1')
  ```
- Cast mocks for method-level stubbing: `(mockRepo.findById as ReturnType<typeof mock>).mockResolvedValue(entity)`

### Integration Tests (`tests/integration/`)
- Test Prisma repository implementations against a **real** Docker PostgreSQL.
- Verify actual SQL queries, constraints, and data mapping.

### E2E Tests (`tests/e2e/`)
- Test full request cycle via `app.handle(new Request(...))`.
- Validate route registration, validation, response shape, and status codes.
- Keep to critical smoke tests — business logic coverage belongs in unit tests.

## Commands
- `bun run dev` — start with watch mode
- `bun run ts` — type-check without emitting (`tsc --noEmit`)
- `bun run build:bin` — compile to a single self-contained binary (`server_bin`)
- `bun run lint` / `bun run lint:fix` — Biome check
- `bun run format` — Biome format
- `bun test` — run all tests
- `bun run db:generate` — generate Prisma client
- `bun run db:migrate` — run Prisma migrations (dev)
- `bun run db:push` — deploy migrations (production)
- `bun run db:reset` — reset database, re-apply migrations, and run seed
- `bun run db:seed` — run seed script
- `bun run db:studio` — open Prisma Studio
