## 1. Planning and Review Gate

- [x] 1.1 Audit the repository for personal references, local-only assumptions, and missing public-project docs.
- [x] 1.2 Draft the ExecPlan for public-repo readiness.
- [x] 1.3 Draft the OpenSpec proposal, design, tasks, and spec delta.
- [x] 1.4 Pause for user review and explicit approval before implementation.

## 2. Public-Facing Doc Cleanup

- [x] 2.1 Sanitize `README.md`, `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `docs/index.md`, `docs/PLANS.md`, and `openspec/project.md` so public-facing docs do not expose personal absolute paths or local skill file paths.
- [x] 2.2 Preserve needed workflow guidance in tool-agnostic wording.

## 3. Contributor and License Docs

- [x] 3.1 Add `CONTRIBUTING.md` at the repo root.
- [x] 3.2 Add a root `LICENSE` file.
- [x] 3.3 Evaluate `SECURITY.md` and skip it for now because the repo does not yet define a supported private disclosure process.

## 4. Validation and Changelog

- [x] 4.1 Re-run path scans for `/Users/`, `.codex/`, and `.claude/` in public-facing docs.
- [x] 4.2 Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`.
- [x] 4.3 Update `docs/CHANGELOG.md` with the public-release hardening pass.
