# Change: Prepare DELIVERATOR for public GitHub release

## Why

DELIVERATOR is moving from a private working tree toward a public repository that other people should be able to read, use, fork, and modify. The current repository still carries personal local-path references and lacks some core contributor-facing documents such as a public contribution guide and license file. That makes the repo look machine-specific and incomplete for external contributors.

## What Changes

- Add a new public-release hardening pass for repository docs and release hygiene.
- Remove or rewrite public-facing references to machine-local Codex and Claude filesystem paths.
- Strengthen `README.md` so it explains what DELIVERATOR is, what exists today, and how an external contributor can run the project.
- Add `CONTRIBUTING.md` and a root `LICENSE` file.
- Optionally add a lightweight `SECURITY.md` if it improves the public baseline without inventing unsupported process promises.
- Add a short release/readiness checklist and record the work in `docs/CHANGELOG.md`.

## Non-Goals

- Redesign the application or change runtime behavior.
- Change API contracts, storage layout, or observability architecture.
- Introduce new governance automation, CI policy, or release tooling.
- Rewrite the research pack under `docs/research/`.

## Impact

- Affected specs:
  - `public-repo`
- Affected docs:
  - `README.md`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `ARCHITECTURE.md`
  - `docs/index.md`
  - `docs/PLANS.md`
  - `openspec/project.md`
  - `docs/CHANGELOG.md`
  - new `CONTRIBUTING.md`
  - new `LICENSE`
- Affected user surface:
  - repository landing experience
  - contributor onboarding
  - public release hygiene

## Build Order and Risk

This is a public-surface repository change rather than an application-runtime change. The main risks are:

- accidentally stripping too much internal workflow guidance while sanitizing local links
- publishing confusing or incomplete contribution instructions
- adding a license the user does not actually want

Mitigations:

- keep a clear review checkpoint before implementation
- default to MIT only as a proposal subject to user review
- preserve internal guidance in tool-agnostic language rather than deleting it entirely
