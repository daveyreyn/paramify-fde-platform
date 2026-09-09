# paramify-fde-platform

> ### About this mirror
>
> This is a **read-only mirror**, published as a work sample. The canonical
> repository is private and internal to Paramify, Inc.
>
> `paramify-fde-platform` is a proof of concept for a Forward-Deployed
> Engineering platform: a monorepo with a Next.js server and web UI, an oclif
> CLI (`fde`) for distributing and running deliverables across teams, and a
> sync integration that mirrors deliverables into Paramify as `AUTOMATED`
> validators. It is a POC, not a released Paramify product.
>
> **Built in collaboration with** Dave, Tate, Ben and Talmage.
>
> **Licensing:** this code is _not_ open source. It is published under a
> view-only license — you are welcome to read it, and that is the only
> permission granted. See [LICENSE](./LICENSE) before doing anything else with
> it. All Paramify names, logos, and marks are reserved.

npm-workspaces monorepo:

```
apps/
  server/    Next.js 16 — frontend + API routes the CLI consumes
  cli/       oclif CLI (`fde`) — `fde login` opens a browser approval page, calls the server API
packages/
  shared/    zod schemas, request/response types, typed ApiClient, env validation (getEnv)
  db/        Prisma 7 schema + lazy client (getPrisma)
  storage/   StorageProvider abstraction for deliverable files (getStorage; local impl, S3 later)
```

## Getting started

```sh
npm install
npm run build          # builds shared → db (incl. prisma generate) → cli → server
```

## Develop

```sh
npm run dev            # next dev on apps/server (http://localhost:3001)
apps/cli/bin/dev.js    # run the CLI from TS source (e.g. `apps/cli/bin/dev.js whoami`)
```

If you edit `packages/shared`, `packages/db`, or `packages/storage`, rebuild them
(`npm run build -w packages/shared`) or leave `npm run dev -w packages/shared` watching.

## Deliverables & the CLI

A deliverable is a file uploaded by a user and shared with teams (m-n). Sharing with a
team the author doesn't belong to, and publishing to the public marketplace, require
`isSuper`. Saving a marketplace deliverable to one of your teams only requires membership.
Re-uploading the same name bumps `version`; every uploaded version is preserved
(`DeliverableVersion`) and can be listed, installed, or deleted individually. Deleting a
deliverable or version requires being the author or super.

```sh
fde login [--no-browser] [--token t]   # browser approval flow; --token for scripts/CI
fde logout                             # revoke the token and delete saved credentials
fde whoami
fde teams                              # list your teams
fde teams use <team>                   # remember a team scope (used by upload/list/save)
fde upload <path> [--name --title --description --tags a,b --team t --private]
fde list [--team t | --all]            # includes LOCAL column: ✓ installed, ↑ outdated
fde marketplace
fde install <name> [--version n]       # download into the vault (sha256-verified)
fde versions <name>                    # list preserved versions
fde vault                              # list installed; `fde vault rm <name>` removes
fde run <name> [args...]               # interpreter by extension, shebang fallback
                                       # use `--` before flags: fde run x -- --flag
fde share <name> --team <t>            # author: own teams; super: any team
fde unshare <name> --team <t>          # remove from a team (same rule as share)
fde publish <name>                     # super only: publish to the marketplace
fde unpublish <name>                   # super only: remove from the marketplace
fde save <name> [--team t]             # marketplace → one of your teams
fde delete <name> [--version n] --yes  # author or super: delete from the server

# CLI configuration
fde config                             # show config (api-url, paramify-url, team, masked token)
fde config set <key> <value>           # keys: api-url, paramify-url, team
fde config unset <key>                 # keys: paramify-url, team

# Paramify validator sync — requires PARAMIFY_URL on the server and a team API key
fde paramify link <name> [--team t]    # create the deliverable as a validator, store the link
fde paramify status <name>             # linked? in sync? (live check against Paramify)
fde paramify sync <name> [--team t]    # full sync: create/recreate if missing, update metadata
fde paramify rm <name> [--team t] --yes  # delete the validator in Paramify and unlink
fde teams set-key <team> [--key k | --clear]  # super only: store the team's Paramify API key

# user & team management — all super only
fde users                              # list users with teams
fde users add <email> [--name n] [--super]   # create; prints a one-time initial password
fde users rm <email> --yes             # delete (blocked while they still own deliverables)
fde teams create <name>
fde teams delete <name> --yes          # detaches members/shares, keeps deliverables
fde teams add <team> <email>           # add a member
fde teams rm <team> <email>            # remove a member
```

The vault lives at `$XDG_DATA_HOME/fde/vault` (default `~/.local/share/fde/vault`);
CLI config (API URL, token, team scope) at `~/.config/fde/config.json`.

API identity is a Bearer `ApiToken` (minted by the browser-approval login flow) with the
web session cookie as fallback — see `apps/server/lib/auth.ts`.

## Scripting & agents

Every command takes `--json`: human output is suppressed, the result is printed as JSON
on stdout, and expected failures become `{"error": {"code", "message"}}` with the same
exit code. The `code` values are a stable contract for scripts (`not_authenticated`,
`forbidden`, `not_found`, `conflict`, `team_ambiguous`, `no_team_scope`,
`confirmation_required`, `not_installed`, `checksum_mismatch`, `server_unreachable`, …);
message text may change. The exception is `fde run`, a pure passthrough — the
deliverable owns stdio and the exit code.

`FDE_TOKEN`, `FDE_API_URL`, `FDE_TEAM`, and `FDE_PARAMIFY_URL` take precedence over the
config file, so a script or agent can run fully stateless — no `fde login`, nothing read
from or written to `~/.config/fde/config.json`, no clobbering a human's saved session on
the same machine:

```sh
FDE_API_URL=https://fde.example.com FDE_TOKEN=fde_… FDE_TEAM=labs fde list --json
```

Conventions worth knowing:

- `fde whoami --json` is the orientation call: user, teams, active team scope, server,
  Paramify URL, and vault state in one round trip.
- Destructive commands (`delete`, `users rm`, `teams delete`, `paramify rm`) never
  prompt interactively; they fail until `--yes` is passed.
- `fde install` is idempotent — re-running reports `"status": "already-installed"`.
- Unknown deliverable names get a `Did you mean …?` suggestion in the error message.
- Exit codes: 0 success, 2 expected error (the JSON `code` says which), 1 unexpected;
  `fde run` exits with the deliverable's own exit code.

## Paramify validator sync

Deliverables can be mirrored into a [Paramify](https://paramify.com) instance as
Validators. The pieces:

- **`PARAMIFY_URL`** (server `.env`) — the Paramify instance base URL.
- **Team API key** — a super user stores a Paramify API key per team
  (`fde teams set-key <team> --key …`). Paramify API keys are bound to a single
  workspace, so the team's key decides which workspace its validators live in —
  no workspace id is configured anywhere. The key needs validator read/write
  permissions, is stored server-side only, and never appears in any response.
- **`fde config set paramify-url …`** (optional, CLI) — overrides the base URL
  used to print validator deep links; defaults to what the server reports.

A link is per (deliverable, team): `fde paramify link` creates an `AUTOMATED`
validator named after the deliverable (statement = description, falling back to
title) via the team's key and records the validator id. `status` live-checks
Paramify and shows drift (re-uploads bump the version and mark the link out of
date). `sync` is a full sync — it updates the validator's name/statement, and
recreates it if it was deleted on the Paramify side. `rm` deletes the validator
in Paramify and removes the link; deleting a deliverable best-effort deletes its
linked validators too. Linking/syncing requires membership in the team (supers
are exempt), same as sharing.

The web UI exposes the same operations: deliverable pages show a Paramify panel
(live status, link/sync/remove) to team members and supers, and supers can set
or clear a team's API key on its team page.

## Configuration

One `.env` at the repo root (see `.env.example`) — everything (Next, prisma CLI, seed)
loads it; real environment variables take precedence. All vars are optional locally.

## Database

SQLite, zero local setup — defaults to `packages/db/prisma/dev.db` (gitignored).

```sh
npm run db:migrate     # prisma migrate dev
npm run db:push        # sync schema without a migration (prototyping only)
npm run db:seed        # teams fedramp/labs + users from USERS (first user is super + in both);
                       # prints each new user's initial password exactly once
npm run db:generate    # prisma generate
```

Deliverable files live outside the db via `@paramify/storage` (`STORAGE_PROVIDER`,
local-only for now) under `STORAGE_DIR` (default `<repo>/.storage`, gitignored).

Deployed, set `DATABASE_URL` to an absolute `file:` URL — the plan is a
litestream-to-S3 replica of the same file (or a hosted db later).
