# Design: Public repository readiness

## Summary

This change prepares DELIVERATOR for public publication on GitHub by cleaning public-facing docs, adding the minimum open-source project documents, and documenting what contributors need to know. The change does not alter runtime behavior. It changes how the repository presents itself to external readers.

## Architectural Constraints

- This change must not change the application runtime, package boundaries, or API behavior.
- `docs/research/` remains imported reference material and is not rewritten in this pass.
- Public-facing docs must not contain personal absolute filesystem paths or assume one developer's local Codex/Claude installation layout.
- The existing one-site Fastify + Vite SPA decision remains unchanged.

## Public-Facing Documentation Scope

### `README.md`

Must answer four questions for an external reader:

- What is DELIVERATOR?
- What exists today in this repository?
- How do I run it locally?
- What should I expect from the current foundation-level state?

### `CONTRIBUTING.md`

Must explain:

- how to approach changes in this repository
- how the Tier 0 / Tier 1 / Tier 2 planning model works
- when ExecPlan and OpenSpec are required
- which validation commands are expected before a change is considered ready
- how to keep docs and changelog updates in sync

### `LICENSE`

Must exist at the repo root. This design assumes MIT unless the user changes the choice during review.

## Sanitization Rules

- Remove public-facing references to `/Users/...`, `.codex/skills/...`, and `.claude/...` local filesystem paths.
- Replace those references with plain-language names such as “the execplan skill” or “the frontend-design skill” when the concept matters.
- Keep internal workflow guidance, but express it in a way that still reads correctly in a public repo.
- Leave localhost and `127.0.0.1` development endpoints intact where they describe local development behavior rather than personal identity.

## Release Hygiene Rules

- The repo-root `.deliverator/` directory remains local gitignored state and should never be presented as a committed product-config surface.
- The public docs should state clearly that the full Docker-backed `make dev` flow requires a running Docker daemon.
- The public docs should reflect the current validation state honestly: host-run checks are green, but Docker-backed smoke validation depends on environment availability.

## Failure Modes and Recovery

- If a sanitization pass removes needed workflow context, rewrite that guidance in tool-agnostic wording rather than restoring absolute local paths.
- If the user rejects the default MIT recommendation, swap the `LICENSE` file without changing the rest of the public-readiness work.
- If additional governance files are requested later, they can be layered on without invalidating this baseline.

## Testing and Review Expectations

Review must confirm:

- public-facing docs no longer expose personal filesystem paths
- `README.md` explains the project clearly to an external reader
- `CONTRIBUTING.md` exists and matches the actual repo workflow
- `LICENSE` exists
- runtime behavior remains unchanged
- path scans and standard repo validations still pass
