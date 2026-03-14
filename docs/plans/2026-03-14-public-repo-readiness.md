# Prepare DELIVERATOR for a public GitHub release

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `docs/PLANS.md`.

## Purpose / Big Picture

After this change, DELIVERATOR can be published as a public GitHub repository without exposing personal machine-specific references or unclear local-only assumptions, and a new contributor can understand what the project is, how to run it, how to contribute, and what rules govern contributions. The public-facing repository should read like an intentional open-source project rather than an internal working tree snapshot.

The observable result is that the root docs explain the project clearly, contribution guidance exists, a public license exists, personal absolute paths and Codex-local links are removed or isolated from public-facing docs, and a short release checklist can be followed before making the repository public.

## Progress

- [x] (2026-03-14 20:05Z) Audit the repository for personal paths, local-only references, missing contributor-facing docs, and public-release risks.
- [ ] Draft the ExecPlan and OpenSpec artifacts for public-repo readiness and stop for user review before implementation.
- [ ] Sanitize public-facing docs and repo policy files so they do not expose `/Users/...`, Codex-local skill links, or machine-specific assumptions after review approval.
- [ ] Add contributor-facing public repo documents after review approval, including `CONTRIBUTING.md` and a root `LICENSE`.
- [ ] Add a public-release checklist and contributor onboarding guidance after review approval.
- [ ] Validate the updated docs, rerun repo checks, and record the result in `docs/CHANGELOG.md` after review approval.

## Surprises & Discoveries

- Observation: the repository still contains many absolute local paths pointing to `/Users/rnikitin/.codex/...` in public-facing Markdown files.
  Evidence: `rg -n --hidden --glob '!node_modules' --glob '!.git' '/Users/|rnikitin|\\.codex/' .` matched `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/index.md`, `docs/PLANS.md`, `ARCHITECTURE.md`, `openspec/project.md`, and plan files.

- Observation: the repository currently has no visible `CONTRIBUTING.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, or `SECURITY.md`.
  Evidence: `rg --files -g 'README*' -g 'CONTRIBUTING*' -g 'LICENSE*' -g 'CODE_OF_CONDUCT*' -g 'SECURITY*' docs .` returned only `README.md` and research/plan READMEs.

- Observation: the repo is still not a Git worktree in this environment.
  Evidence: `git status --short` returned `fatal: not a git repository (or any of the parent directories): .git`.

- Observation: some local developer defaults are intentionally machine-local, such as Grafana admin credentials and localhost endpoints, but they are development scaffolding rather than user secrets.
  Evidence: `docker-compose.obs.yml` sets `GF_SECURITY_ADMIN_USER=admin` and `GF_SECURITY_ADMIN_PASSWORD=admin`, while the rest of the matches were localhost URLs or developer workflow references rather than secret tokens.

## Decision Log

- Decision: Treat public-repo readiness as a Tier 2 change.
  Rationale: This work changes the public surface of the repository, contributor workflow documentation, licensing posture, and release hygiene rules, so it requires both an ExecPlan and OpenSpec review before implementation.
  Date/Author: 2026-03-14 / Codex

- Decision: Remove or rewrite public-facing references to local Codex/Claude skill file paths instead of exposing them in a public README-style experience.
  Rationale: Absolute local paths are not useful to external contributors and make the repository look machine-bound rather than portable.
  Date/Author: 2026-03-14 / Codex

- Decision: Default the public license recommendation to MIT unless the user requests a different license during review.
  Rationale: The user explicitly wants other people to use, fork, and modify the repository, and MIT is the least restrictive common default that matches that goal.
  Date/Author: 2026-03-14 / Codex

## Outcomes & Retrospective

Current stopping point: the audit is complete and the planning artifacts are being prepared. No public-release edits have been made yet under this plan. The next expected outcome, after review approval, is a repository that reads cleanly to an external engineer and has the minimum public-project documentation needed for responsible publishing.

## Context and Orientation

DELIVERATOR is already foundation-bootstrapped. The repo contains `apps/server`, shared packages, observability scaffolding, and a one-site Fastify + Vite SPA architecture. It is no longer a docs-only repo. The public-release work is therefore not about inventing the project; it is about making the existing foundation safe and understandable to outsiders.

The primary files that shape the public face of the repository are:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `ARCHITECTURE.md`
- `docs/index.md`
- `docs/PLANS.md`
- `openspec/project.md`
- `docs/CHANGELOG.md`

The current audit indicates three classes of work.

The first class is sanitization. Several public-facing documents still contain absolute local paths to Codex skill files under `/Users/rnikitin/.codex/...`. Those paths are valid only on one machine and should not appear in a public repository. They must be rewritten into tool-agnostic wording or relative repo guidance.

The second class is contributor-facing documentation. The repo lacks a visible `CONTRIBUTING.md` and `LICENSE`. Those are essential if the repository is meant to be forked and modified by the public. `README.md` also needs a stronger explanation of what the project is, what state it is in, and how an external contributor should approach local setup and contribution.

The third class is release hygiene. A novice contributor needs a short checklist that explains what to verify before publishing and how to tell whether the repository is still carrying personal/local-only references. This work should not try to perfect every open-source governance surface in one pass; it should establish the minimum credible baseline.

## Plan of Work

The first milestone is documentation and sanitization planning. Update the public-facing planning files only as needed to capture this change. Create a new OpenSpec change called `public-repo-readiness`. The proposal should say that the repository is being prepared for public publication and public contribution. The design should explain the sanitization targets, the contributor-doc scope, and the release hygiene rules. The tasks file should include a review checkpoint before implementation.

The second milestone is public-facing doc cleanup. Update `README.md` so that it explains DELIVERATOR to an external reader in plain language, including what is implemented today, what is still foundation-level, and how to run the project locally. Remove or rewrite any references that assume the reader has local Codex skills installed at absolute filesystem paths. Update `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `docs/index.md`, `docs/PLANS.md`, and `openspec/project.md` to keep repo policy coherent while avoiding personal-machine references in public docs. Where internal agent workflow guidance is still needed, keep it tool-agnostic or repo-relative.

The third milestone is contributor-facing public project docs. Add a root `CONTRIBUTING.md` that explains contribution expectations, how to choose the planning tier, when ExecPlan and OpenSpec are required, the expected validation commands, and the basic pull request/change hygiene. Add a root `LICENSE` file; by default this plan assumes MIT unless the user changes that choice during review. If useful, add a lightweight `SECURITY.md` explaining that there is no dedicated security process yet and where to report issues; keep this optional unless the repository would otherwise look incomplete.

The fourth milestone is public-release hygiene. Add a short “before publishing” checklist to `README.md` or a small `docs/releasing.md` file. The checklist should include scanning for absolute local paths, ensuring `.deliverator/` remains gitignored local state, ensuring there are no committed local generated env files, confirming the license is present, and confirming contributor docs exist. Do not overbuild automation in this change; a concise manual checklist is enough.

The fifth milestone is validation and changelog updates. Re-run the repository checks that are applicable without Docker assumptions beyond what already exists. Re-run the path scan to confirm that public-facing docs no longer contain `/Users/rnikitin/.codex/...` links. Update `docs/CHANGELOG.md` with a short implementation note describing the public-release hardening pass.

## Concrete Steps

All commands below are run from `/Users/rnikitin/dev/deliverator` unless another directory is stated explicitly.

1. Create planning artifacts for this change:

       apply_patch ... docs/plans/2026-03-14-public-repo-readiness.md
       apply_patch ... openspec/changes/public-repo-readiness/proposal.md
       apply_patch ... openspec/changes/public-repo-readiness/design.md
       apply_patch ... openspec/changes/public-repo-readiness/tasks.md
       apply_patch ... openspec/changes/public-repo-readiness/specs/public-repo/spec.md

2. After user approval, sanitize public-facing docs and add contributor docs:

       apply_patch ... README.md AGENTS.md CLAUDE.md ARCHITECTURE.md docs/index.md docs/PLANS.md openspec/project.md
       apply_patch ... CONTRIBUTING.md LICENSE [SECURITY.md if needed]

3. Verify that public-facing docs are clean:

       rg -n "(/Users/|\\.codex/|\\.claude/)" README.md AGENTS.md CLAUDE.md ARCHITECTURE.md docs openspec -g '*.md' -g '*.yaml'

   Expected result: no matches in public-facing docs except where a deliberate internal-only note remains outside the public onboarding path.

4. Re-run repository validation and update the changelog:

       pnpm typecheck
       pnpm lint
       pnpm test
       openspec validate public-repo-readiness
       apply_patch ... docs/CHANGELOG.md

## Validation and Acceptance

This plan is ready for implementation only after the user reviews the ExecPlan and explicitly approves moving forward.

The implementation is successful when an external engineer can open `README.md` and understand what DELIVERATOR is, how to run it, and how to contribute, without seeing personal absolute paths or machine-specific skill links. `CONTRIBUTING.md` must exist and describe the planning and validation expectations. `LICENSE` must exist. Public-facing docs should no longer reveal `/Users/rnikitin/...` or local Codex/Claude filesystem references. The repository should still pass `pnpm typecheck`, `pnpm lint`, and `pnpm test`.

The public-readiness proof should include:

- `README.md` clearly describing the project and current foundation scope
- `CONTRIBUTING.md` present at the repo root
- `LICENSE` present at the repo root
- path scans showing no personal absolute-path leakage in public-facing docs
- `docs/CHANGELOG.md` recording the cleanup

## Idempotence and Recovery

This work is documentation-heavy and should be safe to repeat. Sanitization edits should be additive and reviewable. If a wording change removes too much internal guidance, the recovery path is to restore the guidance in tool-agnostic or repo-relative language rather than bringing back absolute local paths.

If the user decides against MIT during review, the `LICENSE` addition should switch to the chosen license without affecting the rest of the plan. If the repository later adds more governance files such as `CODE_OF_CONDUCT.md` or `SECURITY.md`, they can be layered on after this change without invalidating the current public-release baseline.

## Artifacts and Notes

Important audit evidence already captured:

    $ rg -n --hidden --glob '!node_modules' --glob '!.git' '/Users/|rnikitin|\.codex/' .
    README.md:112:For substantial UI or UX work, use the [$frontend-design](/Users/rnikitin/.codex/skills/frontend-design/SKILL.md) skill before implementation.
    AGENTS.md:92:- For Tier 1 work, create an ExecPlan with the [$execplan](/Users/rnikitin/.codex/skills/execplan/SKILL.md) skill before implementation.
    CLAUDE.md:94:- For Tier 1 work, create an ExecPlan with the [$execplan](/Users/rnikitin/.codex/skills/execplan/SKILL.md) skill before implementation.

    $ rg --files -g 'README*' -g 'CONTRIBUTING*' -g 'LICENSE*' -g 'CODE_OF_CONDUCT*' -g 'SECURITY*' docs .
    docs/plans/README.md
    docs/research/README.md
    docs/research/docs/adr/README.md
    ./README.md

These transcripts show both the current leakage and the missing public-project docs.

## Interfaces and Dependencies

This change should not alter the application runtime, API contracts, or package interfaces. The main artifacts introduced are repository documents:

- `CONTRIBUTING.md` at the repo root with contributor workflow guidance
- `LICENSE` at the repo root, assumed MIT unless changed during review
- optional `SECURITY.md` only if it materially improves the public baseline without adding fake process claims

The cleanup should preserve the existing local agent workflow, but public-facing docs should avoid absolute machine paths. Prefer plain names such as “the execplan skill” or “the frontend-design skill” over filesystem links in public docs.

Revision note: created this ExecPlan after auditing the repository for public-release risks. This revision captures the initial audit evidence and introduces a review gate before implementation.
