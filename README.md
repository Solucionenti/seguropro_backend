# Segur Backend

TypeScript backend built with **ElysiaJS** on **Bun**, following clean architecture principles.

## Tech Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Validation**: Zod (Standard Schema)
- **OpenAPI**: `@elysiajs/openapi` + Scalar UI at `/openapi`
- **Database**: PostgreSQL + Prisma ORM (Rust-free, `@prisma/adapter-pg`)
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

# Start dev server (watch mode)
bun run dev
```

Server starts at `http://localhost:3000`. OpenAPI docs at `http://localhost:3000/openapi`.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start with watch mode |
| `bun run start` | Start production |
| `bun run lint` | Biome check |
| `bun run lint:fix` | Biome check + auto-fix |
| `bun run format` | Biome format |
| `bun test` | Run all tests |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── index.ts                         # Entry point — .listen() only
├── app.ts                           # App factory — OpenAPI, CORS, versioned routes
├── config/
│   ├── env.ts                       # Elysia plugin: Zod-validated env vars
│   └── database.ts                  # Elysia plugin: PrismaClient singleton
├── modules/
│   └── [feature]/                   # e.g. health/, user/, auth/
│       ├── domain/
│       │   ├── entities.ts          # Domain types/interfaces
│       │   └── repository.ts        # Repository interface (port)
│       ├── application/
│       │   └── service.ts           # Business logic (use cases)
│       ├── infrastructure/
│       │   └── prisma-repo.ts       # Prisma implementation (adapter)
│       └── presentation/
│           ├── controller.ts        # Elysia plugin (routes)
│           └── schemas.ts           # Zod request/response schemas
├── shared/
│   ├── base-controller.ts           # Base plugin all controllers inherit
│   ├── domain/                      # Shared errors, value objects (one per file)
│   ├── middleware/                   # Error handler, auth guards
│   └── utils/                       # Response helpers, pagination
└── api/
    └── v1.ts                        # v1 router — mounts module controllers
```

## Architecture

**Clean Architecture** with feature-first organization. Dependencies point inward:

**Domain** → **Application** → **Infrastructure** → **Presentation**

- **Domain**: Pure types and interfaces. No framework imports.
- **Application**: Services/use cases. Depends only on domain.
- **Infrastructure**: Prisma repos. Implements domain interfaces.
- **Presentation**: Elysia controllers + Zod schemas. Uses `baseController`.

### Base Controller

Every module controller inherits from `baseController` which provides:
- `env` — validated environment config
- `db` — PrismaClient instance
- Error handler (standard response shape)
- Response helpers (`jsonOk`, `jsonOkNoData`, `jsonPaginated`, `jsonError`)

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

Routes are grouped by version: `/api/v1/...`, `/api/v2/...`. Each version is a separate Elysia instance in `src/api/`.

## Best Practices

- **Exact dependency versions** — no `^` or `~`. Use `bun add --exact`.
- **No `.js` extensions** on imports. Bun resolves TypeScript natively.
- **No barrel exports** — import directly from specific files. Biome enforces this.
- **One class per file** — kebab-case filenames.
- **`@/` path alias** for cross-module imports, relative imports within same module only.
- **Elysia plugin naming**: `@app/[module]/[name]`
- **Zod for all validation** — not Elysia.t / TypeBox.
- **`type` keyword** for type-only imports.
