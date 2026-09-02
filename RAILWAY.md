# Deploying Segur Backend on Railway

Everything in this repo is already wired for Railway. What is left is the dashboard setup.

- Which branch goes where? See [Environments and branches](#environments-and-branches).
- Just showing a demo? Go to [Demo environment](#demo-environment--the-short-path).
- Setting up the real thing? Go to [Infrastructure as Code](#infrastructure-as-code), then
  [What still needs the dashboard](#what-still-needs-the-dashboard).

## Shape of the deployment

One Railway **project**, with the same three services in each environment:

| Service | Source | What it does |
|---------|--------|--------------|
| `Postgres` | Railway database template | Managed PostgreSQL. Provides `DATABASE_URL`. |
| `seguropro_backend` | this repo, via `.railway/railway.ts` | The Elysia API. Public domain, healthcheck, migrations on deploy. |
| `seguropro_jobs` | this repo, via `.railway/railway.ts` | Cron service. Posts the `/api/v1/jobs/*` endpoints once a day and exits. |

`seguropro_backend` and `seguropro_jobs` deploy from the **same repository and the same commit**, both
declared in `.railway/railway.ts`. They differ only in start command and cron schedule.

## Environments and branches

| Railway environment | Git branch | Purpose | Seeded |
|---------------------|-----------|---------|--------|
| `production` (Railway's default) | `main` | Production. **Not set up yet** — nothing deploys here today. | no |
| `dev` | `dev` | QA and demos. This is the one that is live. | yes |

The environment name in Railway must be exactly `dev`, because `.railway/railway.ts` looks it up
in `BRANCH_BY_ENVIRONMENT`. An unmapped name makes the file **throw** rather than fall back, which
is deliberate: a silent default to `main` would deploy stale code onto a live demo.

What actually differs between them:

- **`SEED_ON_DEPLOY`** is `'true'` in `dev` and `'false'` in `production`.
- **`NODE_ENV`** is `development` in `dev`, `production` in `production`. It is only ever logged,
  never branched on.
- **The tracked branch** is `dev` or `main`, resolved in the same ternary.
- **`overlapSeconds` / `drainingSeconds`** are `0` in `dev` so deploys cut over immediately while
  you iterate. `production` keeps the 20 s overlap and 15 s drain, because it is serving traffic
  that should not be dropped mid-request.
- Everything else — builder, pre-deploy, healthcheck, restart policy — is deliberately identical,
  so QA exercises the same deploy path production will.

`main` is currently well behind `dev`. Do not point a production service at it until it has been
brought up to date; a deploy from `main` today would ship old code against a database that
migrations have already moved forward.

CI (`.github/workflows/ci.yml`) runs on pushes to both `main` and `dev`, and on every pull request
regardless of target, so **Wait for CI** has a check suite to gate on in either environment.

## Infrastructure as Code

The whole project — database, services, variables, cron schedule, Wait for CI — is declared in
**`.railway/railway.ts`**. One file describes every resource in an environment.

This replaces Config as Code (`railway.json` / `railway.toml`), which Railway
[deprecated](https://docs.railway.com/config-as-code): new services cannot opt into it and
existing files stop being read on **2026-12-01**. Those two files are gone from this repo; a
service must not be managed by both systems at once.

### Prerequisite: a current CLI

`railway config` does not exist before CLI v4.6. Check and upgrade first:

```bash
railway --version
bun add -g @railway/cli          # or: npm i -g @railway/cli
```

The `railway` npm package (an exact devDependency here) is what `.railway/railway.ts` imports its
DSL from, so `bun install` is enough to make the file type-check locally.

### The workflow

```bash
railway login
railway link                     # project + environment. IaC applies to the LINKED environment
railway config plan              # preview the diff. always read this first
railway config apply             # preview, confirm, apply
```

`railway config pull` imports the project's current state into the authoring file — useful to see
Railway's own naming before trusting the constants at the top of the file.

### This file owns only the backend

The Railway project also holds `seguropro_front`, which lives in a different repository
(`../seguropro_frontend`) and is managed entirely from the dashboard. Since omission means
deletion, a file describing "the whole environment" would treat the frontend as garbage.

The escape hatch is a **named partial**, exported at the top of `.railway/railway.ts`:

```ts
export const partial = 'segur-backend'
```

Ownership is scoped to that name: `omit = delete` then applies only to resources this partial
already owns, so `seguropro_front` is left alone rather than destroyed. The name must stay stable
forever — renaming it orphans everything the partial currently owns.

The frontend needs no `.railway/` file of its own. Dashboard-managed is fine; the deprecation
only kills `railway.json` / `railway.toml`, not manual configuration. If it ever gets one, it
should export its own partial name.

### Read the plan before the first apply — a real example

IaC matches resources by **name**. The first plan in this project looked like this:

```
Plan: 2 to add, 0 to change, 2 to destroy
  + Create service segur-api
  + Create service segur-jobs
  - Delete service seguropro_front
  - Delete service seguropro_backend

! 2 destructive change(s) will remove Railway resources or variables.
```

Two separate mistakes, both caught by `plan` rather than by an outage:

1. The file said `segur-api`; the live service is `seguropro_backend`. A name that does not match
   does not adopt — it **creates a new service and deletes the real one**, taking its domain and
   variables with it.
2. `seguropro_front` was not declared and the file had no partial export, so it was scheduled for
   deletion despite belonging to another repository.

`Postgres` was the one thing that behaved: it appears in neither list, because the name matched
and it was adopted with no changes. That is what a correct line looks like.

After both fixes the plan should read roughly `1 to add` (`seguropro_jobs`, which genuinely does
not exist yet), `1 to change` (`seguropro_backend`, adopting the build and deploy settings), and
**`0 to destroy`**. Treat any `destroy` line as a stop sign until you can name the resource and
explain why it should go.

### Environments in one file

There is no per-environment block. The file receives a context and looks the environment up in a
table, refusing to guess:

```ts
const BRANCH_BY_ENVIRONMENT: Record<string, string> = {
  production: 'main',
  dev: 'dev',
}
const SEEDED_ENVIRONMENTS = ['dev']
```

So `railway link` picking `dev` deploys the `dev` branch, seeds on every deploy and cuts over with
no drain; picking `production` deploys `main`, does not seed and drains gracefully. Same file. An
environment name in neither table throws before anything is applied.

### Can the variables just live in the dashboard?

Their **values** can. Their **names** cannot.

An apply reconciles the environment against the file, and omission means deletion: a variable set
in the dashboard but absent from `.railway/railway.ts` is a deletion candidate. The CLI marks
destructive changes before asking for confirmation, and non-interactive runs need
`--confirm-destructive`, so nothing disappears silently — but the intent of the model is that the
file is the whole picture.

That gives three ways to declare a variable, and the choice is per variable:

| Form | Value lives in | Use it for |
|------|----------------|------------|
| `KEY: 'literal'` | the file | non-secret config you want reproducible |
| `KEY: preserve()` | Railway only | secrets and credentials |
| `KEY: ctx.shared.KEY` | a project-level Shared Variable | a secret two services must agree on |

`preserve()` is what `railway config pull` writes by default, and it is the answer to "keep it out
of code": the name is declared so the apply leaves it alone, the value never enters git. The cost
is that a brand-new environment comes up with that variable **unset** — `JWT_SECRET` and the S3
credentials have to be set once per environment before the service can boot.

This repo splits it that way on purpose: `NODE_ENV`, the JWT expirations, the pagination limits,
`HITO_AVISO_DIAS`, `SEED_ON_DEPLOY`, `STORAGE_DRIVER` and `S3_REGION` are literals, because they
are configuration worth reviewing in a diff. `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` and the
four `S3_*` credentials are `preserve()`. `JOB_SECRET` is `ctx.shared.JOB_SECRET`, so `seguropro_backend`
and `seguropro_jobs` structurally cannot drift — a mismatch there makes every job call answer 401.

Going all-`preserve()` is possible and would keep every value out of code, but it also throws away
the part of IaC that makes an environment reproducible: the file becomes a list of names and a
fresh environment comes up with nothing set.

## Files in this repo

| File | Purpose |
|------|---------|
| `railpack.json` | Builder config. Pins Bun and lets the Node provider detect the rest. |
| `.railway/railway.ts` | **Infrastructure as Code**: the database, both services, their variables, cron schedule and Wait for CI. The single source of truth. |
| `scripts/deploy-prepare.ts` | The pre-deploy entrypoint: `prisma migrate deploy`, then the seed if `SEED_ON_DEPLOY=true`. |
| `scripts/run-scheduled-jobs.ts` | The cron entrypoint. Standalone — needs only a url and `JOB_SECRET`. |
| `.railwayignore` | Keeps docs and CI files out of the build context. |
| `.github/workflows/ci.yml` | Lint, type-check and tests. Railway waits on this before deploying. |

### How the build works

Railpack detects `bun.lock` and installs with Bun, then runs `prisma generate`. That step is
**not optional**: `generated/` is gitignored, so without it the image has no Prisma client and the
server dies on its first import with `Cannot find module @gen/enums`.

It is wired in twice deliberately — as the `build` script in `package.json`, which Railpack
auto-detects, and explicitly in `railpack.json` under `steps.build.commands` so the build does not
depend on that detection. Running it twice costs ~200 ms; not running it costs the service.

Migrations run as the **pre-deploy command**, in a separate container, before the new version
receives traffic. The command is `bun run scripts/deploy-prepare.ts`, which runs
`prisma migrate deploy` and then, only if `SEED_ON_DEPLOY=true` is set on that service,
`prisma db seed`. A non-zero exit aborts the deploy and the previous version keeps serving.

## Demo environment — the short path

This is the `dev` environment, tracking the `dev` branch. For QA and demos you do not need S3, a
custom domain or the cron service. Five required variables, two of which you generate yourself and
two of which Railway fills in for you.

### Generate the secrets

```bash
bun -e "const s=(n=48)=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return Buffer.from(b).toString('base64url')};console.log('JWT_SECRET='+s());console.log('JOB_SECRET='+s())"
```

Both come out 64 chars, well past the 32-char floor `env.ts` enforces. They are unrelated to each
other and to any third party — nothing external has to know them. Rotating `JWT_SECRET`
invalidates every issued token; rotating `JOB_SECRET` means updating it on `seguropro_jobs` too.

### Where each value comes from

| Variable | Where you get it |
|----------|------------------|
| `DATABASE_URL` | Railway. Type `${{Postgres.DATABASE_URL}}` — never paste the literal string. |
| `API_URL` | Railway. Type `https://${{RAILWAY_PUBLIC_DOMAIN}}` after generating a domain. |
| `JWT_SECRET` | You generate it, command above. |
| `JOB_SECRET` | You generate it, command above. |
| `RESEND_API_KEY` | <https://resend.com/api-keys> → **Create API Key**, permission **Sending access**. Shown once, copy it immediately. |
| `EMAIL_FROM` | `Segur Demo <onboarding@resend.dev>` until you verify a domain — see the caveat below. |
| `APP_URL` | Your frontend url. Only used to build the password-reset link. |
| `SEED_ON_DEPLOY` | Set it to `true` on the demo service so every deploy re-seeds. |

`NODE_ENV` is validated but never branched on — it only shows up in the boot log. `PORT` is
injected by Railway; do not set it.

### The Resend caveat that will bite a demo

Resend requires a verified domain to send to arbitrary recipients. Until you verify one, the
shared `onboarding@resend.dev` sender **only delivers to the email address you signed up to
Resend with**. Any other recipient comes back as a 403.

So for a demo, either:

- create the demo OWNER and CLIENT accounts with *your own* Resend signup address, so password
  resets and expiry notices actually land, or
- verify a real domain at <https://resend.com/domains> (a handful of DNS records) and send from
  `no-reply@yourdomain.com`.

Nothing else in the API depends on email, so an unverified account still lets you demo every other
flow — the send just fails and is counted in `fallidas` in the job summary.

### Files go to Cloudflare R2

`STORAGE_DRIVER=s3` with an R2 bucket. R2 has a free tier, needs no volume, and survives a deploy,
which the container filesystem does not. Set `S3_BUCKET`, `S3_ENDPOINT` (the account-level R2
endpoint), `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`; `S3_REGION` stays `auto` for R2.

`env.ts` refuses to boot when the driver is `s3` and any of the four is missing, so a
misconfigured deploy fails immediately instead of at the first upload. A Railway Volume with the
`local` driver is the alternative, but it rules out replicas and adds nothing R2 does not already
give you.

### Seed the demo data

Set `SEED_ON_DEPLOY=true` on the demo service and every deploy re-seeds automatically, as part of
the pre-deploy step that already runs the migrations. Leave it unset in production.

The seed is idempotent, so re-running it is a no-op:

- The system admin is matched on `email` + `companyId: null` — its real identity — not on
  `status`. That distinction matters: a `MASTER_ADMIN` has `companyId = null`, and Postgres treats
  nulls as distinct in a unique index, so `@@unique([companyId, email])` does **not** stop a second
  `admin@segurpro.com` from being inserted. Matching on `status: ACTIVE` did exactly that.
- If the admin exists but is `INACTIVE`/`DELETED`, the seed warns and leaves it alone. Deactivating
  the platform admin is a deliberate act and a seed should not silently undo it. If that happens on
  the demo you will have no working login — reactivate the row by hand.

To run it manually instead:

```bash
railway link                       # pick the project, environment and seguropro_backend
railway run bun run db:seed
```

Either way the login is `admin@segurpro.com` / `Admin123!`, role `MASTER_ADMIN`. That is all the
seed creates — company, owners, agents, clients and polizas you create through the API, starting at
`POST /api/v1/auth/register-owner`.

### Skip the cron service for now

Do not create `seguropro_jobs` for a demo. Trigger the jobs by hand when you want to show them:

```bash
curl -X POST "https://<your-domain>/api/v1/jobs/notificar-polizas-por-vencer" -H "x-job-secret: <JOB_SECRET>"
```

Add `?hoy=YYYY-MM-DD` to replay a date, which is how you demo an expiry notice without waiting for
a policy to actually approach its `fechaVencimiento`.

## What still needs the dashboard

`.railway/railway.ts` owns the builder, start and pre-deploy commands, healthcheck, restart
policy, watch paths, cron schedule, Wait for CI and every non-secret variable. Do
**not** set those by hand — a value typed into the dashboard fights the file.

Four things IaC does not do for you:

1. **Create the project and name the environments.** `railway init` (or the dashboard) once, then
   **Project Settings → Environments**. IaC applies to whichever environment `railway link`
   selected, and it never creates or renames one.

   Railway starts every project with a single environment called `production`. Ours is the
   **`dev`** one, so if `production` is the environment actually holding the demo, rename it via
   the **⋮** menu beside it rather than building a second one — a rename keeps the services,
   variables and database, where a new environment starts empty. `production` then gets recreated
   later, when prod is real.

   The name has to match `BRANCH_BY_ENVIRONMENT` in `.railway/railway.ts` exactly. An unmapped
   name makes the file throw instead of guessing a branch.
2. **Generate the public domain.** **Settings → Networking → Public Networking → Generate
   Domain**, or `railway domain`. `API_URL` is built from `RAILWAY_PUBLIC_DOMAIN`, so the variable
   resolves to nothing until a domain exists.
3. **Set the secrets.** They are `preserve()` in the file on purpose — see
   [Can the variables just live in the dashboard?](#can-the-variables-just-live-in-the-dashboard).

   ```bash
   railway variables --set "JWT_SECRET=..." --set "RESEND_API_KEY=..." \
     --set "EMAIL_FROM=Segur <no-reply@yourdomain.com>" \
     --set "S3_BUCKET=..." --set "S3_ENDPOINT=..." \
     --set "S3_ACCESS_KEY_ID=..." --set "S3_SECRET_ACCESS_KEY=..."
   ```

   `JOB_SECRET` is the exception: it is a **Project Settings → Shared Variables** entry, because
   `seguropro_backend` and `seguropro_jobs` must read the same value or every job call answers 401. The file
   declares it as `ctx.shared.JOB_SECRET`, so they structurally cannot drift.
4. **PR environments**, if you want them: **Project Settings → Environments → Enable PR
   Environments**.

### Services created before IaC

A service that already exists keeps whatever the dashboard has until an apply overwrites it, so
before the first apply confirm that **Settings → Config as Code** is empty and that
**Settings → Deploy → Custom Start Command / Pre-Deploy Command** are both blank. A value typed
into either of those fields outlives the file.

An empty **Config as Code** field is also the explanation for a service that builds fine but never
runs its migrations: with no config file in play there is no `preDeployCommand` at all, which is
exactly how this project's first deploy came up with an empty database.

## The CI/CD flow, end to end

```
push / PR ──► GitHub Actions (.github/workflows/ci.yml)
                 lint · type-check · tests against a real Postgres
                     │
                     ├─ fail ──► Railway deploy is SKIPPED
                     │
                     └─ pass ──► Railway builds with Railpack
                                    │
                                    ├─ install (bun) + build (prisma generate)
                                    ├─ pre-deploy: migrate, then seed if SEED_ON_DEPLOY
                                    ├─ healthcheck GET /api/v1/health
                                    └─ traffic switches over, old version drains
```

A failed healthcheck or a failed migration leaves the previous deployment serving.

## Railway CLI

```bash
bun add -g @railway/cli          # or: npm i -g @railway/cli
railway login
railway link                     # pick project, environment, service

railway variables                # inspect what the service actually has
railway logs                     # tail deploy logs
railway ssh                      # shell INSIDE the running container
railway connect Postgres         # psql against the database service
railway run bun run dev          # run locally against Railway's variables
railway up                       # manual deploy of the working tree, bypasses git
```

`railway run` is the fastest way to reproduce a production-only problem: it injects the real
service variables into a local process without ever copying secrets into `.env`. It does NOT work
for anything touching the database — see
[Running commands against a deployed environment](#running-commands-against-a-deployed-environment)
for why, and use `railway ssh` for migrations.

## Testing the cron by hand

```bash
curl -X POST "https://<your-api-domain>/api/v1/jobs/notificar-polizas-por-vencer" \
  -H "x-job-secret: $JOB_SECRET"
```

Both jobs are idempotent — `NotificacionEnviada` has a unique on `(tipo, entidadId, marca)`, so
re-running the same day sends nothing. Add `?hoy=YYYY-MM-DD` to replay a specific day.

## Running commands against a deployed environment

Three different things, and picking the wrong one is the usual source of confusion:

| Command | Where the code runs | Which `DATABASE_URL` it sees |
|---------|--------------------|------------------------------|
| `railway ssh` | **Inside the running container**, on Railway | The internal one. Works out of the box. |
| `railway run <cmd>` | On your laptop, with the service's variables injected | The internal one — **unreachable from your laptop**. |
| `railway connect Postgres` | Opens `psql` against the database service | n/a, it connects for you |

### `railway ssh` — the one you want for migrations and one-off fixes

```bash
railway link                       # project, environment (dev), service (seguropro_backend)
railway ssh

# now inside the container, on Railway's network:
bunx prisma migrate deploy         # apply migrations
bunx prisma db seed                # idempotent, safe to re-run
bunx prisma migrate status         # what has and has not been applied
```

This is the shell to reach for when the database is missing tables, because it runs with the
service's real internal `DATABASE_URL` and needs no public access. `-s/--service` and
`-e/--environment` target a specific service without re-linking.

### `railway run` — and why it fails against the database

`railway run` injects the service's variables into a process on **your machine**. `DATABASE_URL`
points at `postgres.railway.internal`, a hostname that only resolves inside Railway's network, so
anything touching the database fails to connect.

To reach the database from your laptop you have to expose it: the database service's
**Settings → Networking → Public Access** creates a TCP proxy and populates `DATABASE_PUBLIC_URL`.
Then point Prisma at that instead:

```bash
DATABASE_URL="$(railway variables --service Postgres --kv | grep '^DATABASE_PUBLIC_URL=' | cut -d= -f2-)" \
  bunx prisma migrate deploy
```

Public access bills network egress and widens the database's exposure, so prefer `railway ssh`
for routine work and keep the proxy off unless you actually need a local tool (Prisma Studio, a
GUI client) pointed at it.

### `railway connect` — a psql shell

```bash
railway connect Postgres
\dt                                # list tables — empty means migrations never ran
select count(*) from users;
```

Fastest way to answer "did the migrations actually apply".

## Troubleshooting

### `The table 'public.users' does not exist` on login

Prisma `P2021`. The service is up and serving, so the build worked — the database is simply
empty. Migrations never ran against it.

**Unblock it now** ([`railway ssh`](#running-commands-against-a-deployed-environment) runs inside
the container, so it uses the internal `DATABASE_URL` and needs no public access):

```bash
railway ssh
bunx prisma migrate deploy
bunx prisma db seed
```

**Then find out why it did not happen on its own.** Migrations are supposed to run as the
pre-deploy step. Open the latest deploy's logs and search for:

```
[pre-deploy] migrate: bunx prisma migrate deploy
```

- **The line is there, followed by an error** — the migration itself failed. Read the error; the
  deploy should have aborted, so check whether an older deployment is still serving.
- **The line is missing entirely** — nothing is configuring `preDeployCommand` on this service.
  Check, in order:
  1. **Has `railway config apply` run against this environment at all?** `.railway/railway.ts`
     only takes effect once applied. `railway config plan` shows whether the service's current
     state already matches the file.
  2. **Settings → Deploy → Custom Start Command** and **Pre-Deploy Command** — a value typed into
     the dashboard outlives the file. Clear both.
  3. **Settings → Config as Code** — must be empty. This was the original cause here: the field
     was never set, so the old `railway.json` was never read and the service had no pre-deploy
     command whatsoever.

The start command is a quick tell in the logs. `bun run src/index.ts` on its own means the config
is being applied. A nested `bun run start` wrapping it means Railpack fell back to auto-detecting
`package.json`, which is the same signal that nothing is configuring the service.

### `Cannot find module '@gen/enums'` on boot

```
error: Cannot find module '@gen/enums' from '/app/src/modules/<any>/presentation/controller.ts'
error: script "start" exited with code 1
```

The Prisma client is missing from the image. `@gen/*` maps to `generated/prisma/*`, which is
gitignored and therefore has to be regenerated during every build. Note that `@/` imports
resolved fine before this line — tsconfig paths are working, the files just are not there.

Check, in order:

1. **Is the build config actually in the deployed commit?** `railpack.json` and the `build` script
   in `package.json` only take effect once they are pushed to the branch the service tracks. A
   tell-tale sign is a doubled error: `bun run start` wrapping `bun run src/index.ts` means
   Railpack fell back to auto-detecting the `start` script, so the deploy config was not in the
   commit either.
2. **Did the build log run `prisma generate`?** Look for
   `✔ Generated Prisma Client (7.4.1) to ./generated/prisma` in the Railway build logs. If it is
   absent, the `build` step did not fire.
3. Reproduce locally to be certain it is the same failure:

```bash
rm -rf generated && bun run src/index.ts   # crashes exactly like Railway
bun run build && bun run src/index.ts      # boots
```

`prisma generate` is wired in twice on purpose — as the `build` script in `package.json` (what
Railpack auto-detects) and explicitly in `railpack.json` under `steps.build.commands`. It is
idempotent and takes ~200 ms, and a missing client takes the whole service down.

## Notes

- `seguropro_jobs` reaches the API over its **public** domain. Railway's private network is
  IPv6-only and the server binds to `0.0.0.0`, so private networking would need
  `app.listen({ port, hostname: '::' })` in `src/index.ts` first. Two requests a day over the
  public edge is not worth that change today.
- `railpack.json` pins Bun to `1.3.14`. If a build ever fails resolving that version, loosen it
  to `"1.3"`.
