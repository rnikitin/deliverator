# Development

This file is the contributor setup and local workflow guide.

## Prerequisites

- Bun 1.3.9+
- Node.js 22

Bun is the package manager and primary command entrypoint.

Important compatibility note:
- use `bun install`, `bun run dev`, `bun run start`, `bun run test`
- do not use `bun test` directly in this repo right now

Reason:
- the repo still uses libraries such as `better-sqlite3`
- direct Bun runtime and Bun's built-in test runner are not yet stable enough for this stack
- `bun run ...` remains the supported developer contract and invokes the compatible runtime path underneath

## Install

From the repo root:

```bash
bun install
```

## Common Commands

From the repo root:

```bash
bun run dev
bun run start
bun run open
bun run logs -- --grep request_started
bun run typecheck
bun run lint
bun run test
bun run build
openspec list
openspec validate <change-name>
```

What they do:
- `bun run dev` starts the local app in watch mode
- `bun run start` starts the app once in the foreground and reuses the saved local port from `~/.deliverator/run/preferences.json`
- `bun run open` prints the current URL and opens the browser
- `bun run logs` searches JSONL logs

## Validation Path

The smallest reliable local validation set is:

```bash
bun run typecheck
bun run lint
bun run test
```

For runtime validation:

```bash
bun run start
curl -fsS http://127.0.0.1:<printed-port>/healthz
bun run logs -- --grep deliverator_server_started
```

## Local State Model

Global DELIVERATOR state lives under:

```text
~/.deliverator/
```

That includes:
- `data/registry.db`
- `run/current.json`
- `run/preferences.json`
- `logs/app.jsonl`

Managed project state lives in the target project itself:

```text
<project>/.deliverator/shared/
<project>/.deliverator/local/
```

Do not treat the DELIVERATOR app repo root as the global runtime home.

## Troubleshooting

- If `bun run open` says no running instance exists, check `~/.deliverator/run/current.json` and start the app again with `bun run start`.
- If you want to change the saved local port, run `bun run start -- --port <port>`. That port becomes the new default for future starts.
- If browser opening fails on your platform, the command still prints the URL; open it manually.
- If you need to inspect logs by project, use:

```bash
bun run logs -- --project <slug>
```

- `openspec list` and `openspec validate` may print PostHog flush errors for `edge.openspec.dev`. If the command itself reports success, treat that as telemetry noise rather than a repo failure.
