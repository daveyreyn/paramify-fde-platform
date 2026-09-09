---
name: fde-cli
description: >
  Drive the fde CLI (Paramify FDE platform: deliverables, teams, users, vault,
  Paramify validator sync) from scripts or agent sessions. Use when asked to
  list/upload/install/run/share/publish deliverables, manage teams or users, or
  check who is logged in. Covers --json output, FDE_* env vars for stateless
  auth, error codes, and the --yes confirmation convention.
---

# Driving the fde CLI

Built CLI: `apps/cli/bin/run.js` (after `npm run build`); from TS source: `apps/cli/bin/dev.js`.
If `fde` is on PATH, use it directly. Full command list: `fde --help` or the README.

## Preflight

Start with one orientation call:

```sh
fde whoami --json
# → { user, teams, activeTeam, apiUrl, paramifyUrl, vault: { dir, installed } }
```

`not_authenticated` means run with `FDE_TOKEN` set (preferred for agents) or ask the
user to run `fde login` themselves — never start the browser flow from a script
without `--no-browser`; it blocks waiting for a browser approval.

## Output contract

- Add `--json` to every command. Success: the result object on stdout, exit 0.
  Expected failure: `{"error": {"code": "...", "message": "..."}}` on stdout, exit 2.
  Branch on `code`, not the message text.
- Codes: `not_authenticated`, `forbidden`, `not_found`, `conflict`, `team_ambiguous`,
  `no_team_scope`, `confirmation_required`, `not_installed`, `checksum_mismatch`,
  `server_unreachable`, `invalid_token`, `no_saved_config`, `cli_error` (uncoded),
  `api_error` (other HTTP errors).
- Exception: `fde run <name> [-- args…]` is a pure passthrough — no `--json`; stdio
  and the exit code belong to the executed deliverable. Put `--` before any flags
  meant for the deliverable.

## Stateless auth (don't touch the user's saved session)

`FDE_TOKEN`, `FDE_API_URL`, `FDE_TEAM`, `FDE_PARAMIFY_URL` override
`~/.config/fde/config.json`. Prefer them over `fde login --token` / `fde teams use` /
`fde config set`, which all write to the shared config file:

```sh
FDE_API_URL=http://localhost:3000 FDE_TOKEN=fde_… FDE_TEAM=labs fde list --json
```

## Recovery patterns

- `team_ambiguous` / `no_team_scope`: the message lists the user's teams — re-run with
  `--team <name>` (or set `FDE_TEAM`).
- `confirmation_required`: the destructive gate (`delete`, `users rm`, `teams delete`,
  `paramify rm`). Re-run with `--yes` only when deletion is actually intended.
- `not_found` / `not_installed`: the message may include a `Did you mean …?` candidate.
- `fde install` is idempotent: re-running returns `"status": "already-installed"`.
- `fde users add --json` returns `initialPassword` — shown exactly once, capture it.
