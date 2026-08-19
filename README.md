# Segur Backend

TypeScript backend built with **ElysiaJS** on **Bun**, following clean architecture principles.

## Tech Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Validation**: Zod (Standard Schema)
- **OpenAPI**: `@elysiajs/openapi` + Scalar UI at `/openapi`
- **Database**: PostgreSQL + Prisma ORM (Rust-free, `@prisma/adapter-pg`)
- **JWT**: `jose` (access + refresh token pair, Argon2id password hashing via `Bun.password`)
- **Testing**: `bun test`
- **Linting/Formatting**: Biome v2
- **TypeScript**: 5.9.3 (exact)

## Quick Start

```bash
# Install dependencies (exact versions enforced)
bun install

# Start local PostgreSQL
docker compose up -d

# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed initial system user
bun run db:seed

# Start dev server (watch mode)
bun run dev
```

Server starts at `http://localhost:3000`. OpenAPI docs at `http://localhost:3000/openapi`.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start with watch mode |
| `bun run start` | Start production |
| `bun run ts` | Type-check without emitting (`tsc --noEmit`) |
| `bun run build:bin` | Compile to single binary |
| `bun run lint` | Biome check |
| `bun run lint:fix` | Biome check + auto-fix |
| `bun run format` | Biome format |
| `bun test` | Run all tests |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations (dev) |
| `bun run db:push` | Deploy migrations (production) |
| `bun run db:reset` | Reset database, re-apply migrations, and run seed |
| `bun run db:seed` | Run seed script |
| `bun run db:studio` | Open Prisma Studio |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | — | PostgreSQL connection string (required) |
| `JWT_SECRET` | — | JWT signing secret, min 32 chars (required) |
| `JWT_ACCESS_EXPIRATION` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token TTL |
| `PAGINATION_DEFAULT_PAGE_SIZE` | `20` | Default page size for paginated endpoints |
| `PAGINATION_MAX_PAGE_SIZE` | `100` | Maximum allowed page size |

See `.env.example` for a template.

## Project Structure

```
src/
├── index.ts                         # Entry point — .listen() only
├── app.ts                           # App factory — OpenAPI, CORS, versioned routes
├── config/
│   ├── env.ts                       # Zod-validated env vars (envConfig singleton)
│   ├── database.ts                  # PrismaClient singleton + global omit + dbPlugin
│   └── services.ts                  # DI wiring — all service/repo instantiation
├── modules/
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── auth-service.ts      # IAuthService interface
│   │   │   ├── auth-user-provider.ts # AuthUserProvider port (cross-module boundary)
│   │   │   └── entities.ts          # LoginInput, LoginResult, IdentifyResult
│   │   ├── application/
│   │   │   └── service.ts           # AuthService (login + identify)
│   │   ├── infrastructure/
│   │   │   └── prisma-auth-user-provider.ts  # Prisma adapter for AuthUserProvider
│   │   └── presentation/
│   │       ├── controller.ts        # POST /auth/login, POST /auth/identify
│   │       └── schemas.ts           # Zod: loginSchema, identifySchema
│   ├── health/
│   │   ├── domain/
│   │   │   ├── entities.ts          # HealthStatus
│   │   │   ├── health-service.ts    # IHealthService interface
│   │   │   └── repository.ts        # HealthRepository port
│   │   ├── application/
│   │   │   └── service.ts           # HealthService
│   │   ├── infrastructure/
│   │   │   └── prisma-repo.ts       # Prisma health check adapter
│   │   └── presentation/
│   │       └── controller.ts        # GET /health
│   ├── user/
│       ├── domain/
│       │   ├── entities.ts          # User, UserWithCompany, CompanyInput, etc.
│       │   ├── repository.ts        # UserRepository port
│       │   └── service.ts           # IUserService interface + input types
│       ├── application/
│       │   └── service.ts           # UserService (admin/owner/profile CRUD)
│       ├── infrastructure/
│       │   └── prisma-repo.ts       # PrismaUserRepository adapter
│       └── presentation/
│           ├── controller.ts        # CRUD routes: /admins, /owners, /me
│           └── schemas.ts           # Zod: create/update schemas per role
│   └── columna-kanban/
│       ├── domain/                  # Kanban column entity, port, and use cases
│       ├── application/             # CRUD service
│       ├── infrastructure/          # Prisma adapter with physical delete
│       └── presentation/            # /columnas-kanban CRUD routes and schemas
├── shared/
│   ├── domain/
│   │   ├── app-error.ts             # Base AppError class
│   │   ├── base-entity.ts           # BaseEntity (id, status, createdAt, updatedAt)
│   │   ├── forbidden-error.ts       # 403 ForbiddenError
│   │   ├── jwt-service.ts           # JwtService interface
│   │   ├── not-found-error.ts       # 404 NotFoundError
│   │   ├── password-hasher.ts       # PasswordHasher interface
│   │   ├── unauthorized-error.ts    # 401 UnauthorizedError
│   │   └── validation-error.ts      # 400 ValidationError
│   ├── infrastructure/
│   │   ├── bun-password-hasher.ts   # Argon2id via Bun.password
│   │   └── jose-jwt-service.ts      # JWT via jose library
│   ├── middleware/
│   │   └── error-handler.ts         # Global error handler (AppError → ApiResponse)
│   ├── routers/
│   │   ├── public-router.ts         # Base: db + errors + response + paginated macro
│   │   └── auth-router.ts           # Extends public: JWT auth + withRole macro
│   └── utils/
│       ├── pagination.ts            # Shared Zod: paginationQuery, idParams
│       ├── response.ts              # Response helpers plugin (jsonOk, jsonPaginated, etc.)
│       └── response-types.ts        # ApiResponse<T>, PaginationInfo, ApiMeta
├── api/
│   └── v1.ts                        # v1 router — mounts all module controllers
prisma/
├── schema.prisma                    # Database schema (including Poliza and ColumnaKanban)
├── seed.ts                          # Seed script — creates initial MASTER_ADMIN
└── migrations/                      # Migration history
```

## Architecture

**Clean Architecture** with feature-first organization. Dependencies point inward:

**Domain** → **Application** → **Infrastructure** → **Presentation**

- **Domain**: Pure types (derived via `Pick<PrismaModel, ...>`) and interfaces. No framework imports.
- **Application**: Services/use cases. Depends only on domain. Framework-free and unit-testable.
- **Infrastructure**: Prisma repos. Implements domain interfaces.
- **Presentation**: Elysia controllers + Zod schemas. Uses `publicRouter` or `authRouter`.

### Routers

Every module controller inherits from one of two base routers:

- **`publicRouter`**: Provides `db`, error handler, response helpers (`jsonOk`, `jsonPaginated`, etc.), and the `paginated` macro.
- **`authRouter`**: Extends `publicRouter` + JWT auth resolution (`userId`, `userRole`, `companyId`) + `withRole` macro for role-based access.

### Macros

- **`paginated: true`** — Automatically adds pagination query schema and resolves typed `page`/`pageSize` into handler context. No manual `query: paginationQuery` needed.
- **`withRole: UserRole.MASTER_ADMIN`** — Checks JWT role before handler. Throws `ForbiddenError` (403) on mismatch. Accepts single role or array.

### Standard Response Shape

All endpoints return:
```json
{
  "data": "...",
  "success": true,
  "message": "optional",
  "meta": {
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### API Versioning

Routes are grouped by version: `/api/v1/...`. Each version is a separate Elysia instance in `src/api/`.

### Multi-Tenant Model

- Each **Company** is an isolated tenant. All queries scoped by `companyId`.
- Users unique per company: `@@unique([companyId, email])`.
- `MASTER_ADMIN` users have `companyId = null` (platform level).
- JWT tokens carry `companyId` for tenant isolation.
- Login flow: `POST /auth/identify` (email → companies) → `POST /auth/login` (email + password + companyId → tokens).
- Kanban columns are tenant-scoped through `companyId`; policies optionally reference them with `kanbanId`. Use `PATCH /api/v1/polizas/:id/kanban` to change only that relationship.

## Entity Conventions

- All domain entities extend `BaseEntity` (`id`, `status: ResourceStatus`, `createdAt`, `updatedAt`)
- All Prisma models include `status ResourceStatus @default(ACTIVE)`, `createdAt`, `updatedAt`
- Domain types derive from Prisma via `Pick<ModelType, ...>` — no field redeclaration
- Prisma enums imported from `@gen/enums` — single source of truth
- **Soft deletion by default** — set `status = 'DELETED'`. `ColumnaKanban` is the explicit physical-delete exception; deleting it clears related `Poliza.kanbanId` through `ON DELETE SET NULL`. All reads filter `status: 'ACTIVE'` by default
- Prisma global `omit: { user: { passwordHash: true } }` — `passwordHash` excluded by default

## Dependency Injection

- Services are **classes** with **interfaces** (ports). Dependencies injected via constructor.
- Interfaces in `domain/`, implementations in `infrastructure/`.
- All wiring in `src/config/services.ts` — exports per-module Elysia service plugins.
- Controllers `.use()` only needed service plugins. No monolithic DI.
- Cross-module data access via dedicated ports (e.g. Auth's `AuthUserProvider`), never direct imports.

## Auth

- **JWT**: `jose` via `JwtService` interface + `JoseJwtService` class (access + refresh tokens)
- **Password hashing**: `Bun.password` via `PasswordHasher` interface + `BunPasswordHasher` class (Argon2id)
- **Auth resolution**: `authRouter` extracts Bearer token via `.resolve()`, attaches `userId`, `userRole`, `companyId`
- **Role-based access**: `withRole` macro — `{ withRole: UserRole.MASTER_ADMIN }`

## Seeding

`prisma/seed.ts` creates an initial `MASTER_ADMIN` system user on first run. Runs automatically on `bun run db:reset` or manually via `bun run db:seed`.

## Best Practices

- **Exact dependency versions** — no `^` or `~`. Use `bun add --exact`.
- **No `.js` extensions** on imports. Bun resolves TypeScript natively.
- **No barrel exports** — import directly from specific files. Biome enforces this.
- **One class per file** — kebab-case filenames.
- **`@/` path alias** for cross-module imports. `@gen/` for generated Prisma types.
- **Elysia plugin naming**: `@app/[module]/[name]`
- **Zod for all validation** — not Elysia.t / TypeBox.
- **`type` keyword** for type-only imports.
- **Soft deletion enforced by default** — never use real DELETE except the explicit `ColumnaKanban` physical-delete flow.
