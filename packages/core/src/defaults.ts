/**
 * Default project configuration files for `<project>/.deliverator/shared/`.
 *
 * These are written at first startup if missing. Operators can then
 * customise them in place — DELIVERATOR never overwrites existing files.
 */

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export const DEFAULT_WORKFLOW_YAML = `version: 1
workflow_id: deliverator-default

board:
  columns:
    - inbox
    - discovery
    - research
    - build_test
    - feedback
    - deploy
    - done
  swimlanes:
    by: project
  filters:
    - project
    - stage
    - attention_state
    - priority
    - has_pr
    - requires_human

policies:
  manual_moves_only:
    - inbox
    - discovery
    - research
    - feedback
  auto_moves_allowed:
    - build_test
    - deploy

stages:
  inbox:
    title: Inbox
    mode: manual
    description: User prepares the task, writes the description, and attaches artifacts.
    allowed_manual_moves_to:
      - discovery

  discovery:
    title: Discovery
    mode: hybrid
    entry_actions:
      - kind: workspace.ensure
        uses: git_worktree
      - kind: scm.branch.ensure
        uses: github_cli
      - kind: scm.pr.ensure
        uses: github_cli
    actions:
      - uses: recipe.discovery.questions
    gates:
      - kind: await_human_input
        materialize_to: artifacts/current/discovery_answers.md
    allowed_manual_moves_to:
      - research

  research:
    title: Research
    mode: hybrid
    actions:
      - uses: recipe.research.execplan
      - uses: recipe.research.openspec
    feedback_loop:
      on_new_human_comments:
        - kind: artifacts.materialize_feedback
          uses: builtin
        - uses: recipe.research.execplan
        - uses: recipe.research.openspec
    gates:
      - kind: await_human_approval
    exit_actions:
      - kind: scm.commit_if_changed
        uses: builtin_git
      - kind: scm.push_if_changed
        uses: github_cli
    allowed_manual_moves_to:
      - build_test

  build_test:
    title: Build&Test
    mode: automated
    loop:
      max_iterations: 12
      max_no_progress_iterations: 2
      max_same_open_items_repeats: 2
      body:
        - kind: openspec.list_open_items
          uses: openspec_cli
        - uses: recipe.build.loop
    completion:
      all_of:
        - openspec.no_open_items
        - tests.all_green
        - review.no_blockers
        - runtime.dev_boot_ok
    exit_actions:
      - kind: scm.commit_if_changed
        uses: builtin_git
      - kind: scm.push_if_changed
        uses: github_cli
      - kind: board.move
        uses: builtin
        with:
          to: feedback

  feedback:
    title: Feedback
    mode: hybrid
    feedback_loop:
      on_new_human_comments:
        - kind: artifacts.materialize_feedback
          uses: builtin
        - uses: recipe.feedback.apply
        - kind: scm.commit_if_changed
          uses: builtin_git
        - kind: scm.push_if_changed
          uses: github_cli
    allowed_manual_moves_to:
      - research
      - deploy

  deploy:
    title: Deploy
    mode: hybrid
    actions:
      - uses: recipe.deploy.finalize
    gates:
      - kind: await_archive
    exit_actions:
      - kind: scm.branch.delete
        uses: github_cli
      - kind: workspace.cleanup
        uses: git_worktree
      - kind: board.move
        uses: builtin
        with:
          to: done

  done:
    title: Done
    mode: terminal
`;

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

const RECIPE_BUILD_LOOP = `recipe_id: build.loop
kind: loop_recipe
description: Implement the next OpenSpec slice, test it, review it, and simplify it.

actions:
  - kind: agent.run
    uses: codex_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/build/implement.system.md
  - kind: agent.run
    uses: claude_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/build/tests_and_fixes.system.md
  - kind: tests.unit.run
    uses: project_commands
  - kind: tests.integration.run
    uses: project_commands
  - kind: tests.e2e.run
    uses: project_commands
  - kind: agent.run
    uses: claude_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/build/review.system.md
  - kind: agent.run
    uses: codex_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/build/review_fix.system.md
  - kind: agent.run
    uses: claude_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/build/simplify.system.md
      repeat: 2
  - kind: openspec.refresh_status
    uses: openspec_cli

outputs:
  - path: artifacts/current/build_report.md
    kind: build_report
  - path: artifacts/current/test_report.json
    kind: test_report
  - path: artifacts/current/review_report.md
    kind: review_report
`;

const RECIPE_DEPLOY_FINALIZE = `recipe_id: deploy.finalize
kind: deployment_recipe
description: Rebase/merge the task branch, run deploy commands, and finalize SCM state.

actions:
  - kind: scm.rebase_on_main
    uses: github_cli
  - kind: scm.resolve_conflicts_attempt
    uses: codex_cli
  - kind: scm.pr.merge
    uses: github_cli
  - kind: runtime.post_deploy_commands
    uses: project_commands
  - kind: scm.pr.close_if_required
    uses: github_cli

outputs:
  - path: artifacts/current/deploy_report.md
    kind: deploy_report
`;

const RECIPE_DISCOVERY_QUESTIONS = `recipe_id: discovery.questions
kind: artifact_recipe
description: Research the repo and task description, then produce a concise list of clarifying questions.

actions:
  - kind: agent.run
    uses: claude_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/discovery/questions.system.md
      output_schema: .deliverator/shared/schemas/action-result.schema.json

inputs:
  - task.title
  - task.description
  - task.comments.all
  - task.attachments.all
  - repo.directory_map
  - repo.key_files

outputs:
  - path: artifacts/current/discovery_questions.md
    kind: discovery_questions

validators:
  - markdown_exists
  - non_empty_output
`;

const RECIPE_FEEDBACK_APPLY = `recipe_id: feedback.apply
kind: mutation_recipe
description: Apply human feedback to the current task workspace.

actions:
  - kind: agent.run
    uses: claude_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/feedback/apply.system.md
  - kind: tests.unit.run
    uses: project_commands

outputs:
  - path: artifacts/current/feedback_delta.md
    kind: feedback_delta
`;

const RECIPE_RESEARCH_EXECPLAN = `recipe_id: research.execplan
kind: artifact_recipe
description: Produce or revise the canonical ExecPlan artifact for the task.

resolver:
  mode: personalizable
  candidates:
    - repo://.deliverator/shared/recipes/research.execplan.yml
    - profile://recipes/research.execplan.yml

actions:
  - kind: agent.run
    uses: claude_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/research/execplan.system.md
      skill_ref: profile://execplan/default
      output_schema: .deliverator/shared/schemas/action-result.schema.json

inputs:
  - task.title
  - task.description
  - task.comments.stage
  - task.attachments.stage
  - artifacts/current/discovery_questions.md
  - artifacts/current/discovery_answers.md
  - repo.context

outputs:
  - path: artifacts/current/execplan.md
    kind: execplan

validators:
  - markdown_exists
  - execplan_contract_v1
`;

const RECIPE_RESEARCH_OPENSPEC = `recipe_id: research.openspec
kind: artifact_recipe
description: Produce or revise OpenSpec artifacts for the task.

actions:
  - kind: agent.run
    uses: codex_cli
    with:
      system_prompt_file: .deliverator/shared/prompts/research/openspec.system.md
      output_schema: .deliverator/shared/schemas/action-result.schema.json

inputs:
  - task.title
  - task.description
  - task.comments.stage
  - task.attachments.stage
  - artifacts/current/execplan.md
  - repo.context

outputs:
  - path: openspec/
    kind: openspec_dir

validators:
  - openspec_exists
`;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const SCHEMA_ACTION_RESULT = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://deliverator.dev/schemas/action-result.schema.json",
  "title": "ActionResult",
  "type": "object",
  "required": ["status", "decision", "summary", "artifacts"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "failed_retryable", "failed_terminal", "blocked", "cancelled"]
    },
    "decision": {
      "type": "string",
      "enum": ["continue", "repeat", "human_handoff", "blocked", "advance", "stop"]
    },
    "summary": { "type": "string" },
    "artifacts": {
      "type": "array",
      "items": { "type": "string" }
    },
    "structured_output": {
      "type": ["object", "array", "string", "number", "boolean", "null"]
    },
    "validator_results": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "passed"],
        "properties": {
          "name": { "type": "string" },
          "passed": { "type": "boolean" },
          "message": { "type": "string" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
`;

const SCHEMA_RECIPE = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://deliverator.dev/schemas/recipe.schema.json",
  "title": "Recipe",
  "type": "object",
  "required": ["recipe_id", "kind", "actions"],
  "properties": {
    "recipe_id": { "type": "string" },
    "kind": { "type": "string" },
    "description": { "type": "string" },
    "resolver": { "type": "object" },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["kind", "uses"],
        "properties": {
          "kind": { "type": "string" },
          "uses": { "type": "string" },
          "with": { "type": "object" },
          "repeat": { "type": "integer", "minimum": 1 }
        },
        "additionalProperties": true
      }
    },
    "inputs": {
      "type": "array",
      "items": { "type": "string" }
    },
    "outputs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path", "kind"],
        "properties": {
          "path": { "type": "string" },
          "kind": { "type": "string" }
        },
        "additionalProperties": true
      }
    },
    "validators": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "additionalProperties": true
}
`;

const SCHEMA_RUN_MANIFEST = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://deliverator.dev/schemas/run-manifest.schema.json",
  "title": "RunManifest",
  "type": "object",
  "required": ["run_id", "task_id", "stage", "runtime", "actions"],
  "properties": {
    "run_id": { "type": "string" },
    "task_id": { "type": "string" },
    "stage": { "type": "string" },
    "trigger": { "type": "string" },
    "runtime": { "type": "string" },
    "workspace_path": { "type": "string" },
    "started_at": { "type": "string" },
    "ended_at": { "type": "string" },
    "resolved_recipes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["recipe_id", "source"],
        "properties": {
          "recipe_id": { "type": "string" },
          "source": { "type": "string" },
          "version": { "type": "string" },
          "sha256": { "type": "string" }
        },
        "additionalProperties": false
      }
    },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["action_id", "kind", "adapter"],
        "properties": {
          "action_id": { "type": "string" },
          "kind": { "type": "string" },
          "adapter": { "type": "string" },
          "status": { "type": "string" },
          "exit_code": { "type": ["integer", "null"] }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
`;

const SCHEMA_STAGE_RESULT = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://deliverator.dev/schemas/stage-result.schema.json",
  "title": "StageResult",
  "type": "object",
  "required": ["stage", "decision", "status"],
  "properties": {
    "stage": { "type": "string" },
    "status": {
      "type": "string",
      "enum": [
        "success", "failed_retryable", "failed_terminal",
        "blocked", "awaiting_human_input", "awaiting_human_approval", "cancelled"
      ]
    },
    "decision": {
      "type": "string",
      "enum": [
        "advance", "repeat", "human_handoff", "blocked",
        "failed_retryable", "failed_terminal", "stop"
      ]
    },
    "next_stage": { "type": "string" },
    "artifact_refs": {
      "type": "array",
      "items": { "type": "string" }
    },
    "blocking_reasons": {
      "type": "array",
      "items": { "type": "string" }
    },
    "metrics": {
      "type": "object",
      "additionalProperties": { "type": ["number", "string", "boolean", "null"] }
    }
  },
  "additionalProperties": false
}
`;

const SCHEMA_WORKFLOW = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://deliverator.dev/schemas/workflow.schema.json",
  "title": "Workflow",
  "type": "object",
  "required": ["version", "workflow_id", "stages"],
  "properties": {
    "version": { "type": "integer" },
    "workflow_id": { "type": "string" },
    "board": { "type": "object" },
    "stages": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "mode": { "type": "string" },
          "description": { "type": "string" },
          "entry_actions": { "type": "array" },
          "actions": { "type": "array" },
          "loop": { "type": "object" },
          "gates": { "type": "array" },
          "exit_actions": { "type": "array" },
          "allowed_manual_moves_to": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "additionalProperties": true
      }
    }
  },
  "additionalProperties": true
}
`;

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const PROMPT_BUILD_IMPLEMENT = `# Build Implement

You are executing one bounded BuildTest iteration.

Your goal:
- inspect current open OpenSpec items;
- choose the next meaningful slice of work;
- implement it in the current workspace;
- leave the repo in a testable state.

Rules:
- prefer small, verifiable progress;
- do not declare completion unless the relevant OpenSpec items are actually satisfied;
- if a task is blocked, explain the blocker clearly in the build report.
`;

const PROMPT_BUILD_REVIEW_FIX = `# Build Review Fix

Apply the fixes required by the current review report.

Do not widen scope unnecessarily.
Preserve passing behavior.
`;

const PROMPT_BUILD_REVIEW = `# Build Review

Review the current workspace changes as a separate pass.

Look for:
- correctness bugs
- edge cases
- missing tests
- accidental complexity
- broken assumptions vs OpenSpec or ExecPlan

Write a concise review report.
`;

const PROMPT_BUILD_SIMPLIFY = `# Build Simplify

Perform a focused simplification pass.

Goals:
- reduce unnecessary complexity;
- improve readability;
- keep behavior and tests intact.

This prompt may be run multiple times in sequence.
`;

const PROMPT_BUILD_TESTS_AND_FIXES = `# Build Tests and Fixes

You are responsible for:
- adding missing tests;
- running the relevant validations;
- fixing failures that are directly related to the current slice.

Prefer the strongest project-appropriate validation bundle available.
`;

const PROMPT_DEPLOY_FINALIZE = `# Deploy Finalize

Finalize the task for deployment.

Goals:
- bring the branch up to date with main;
- resolve straightforward conflicts safely;
- perform the configured merge;
- run post-deploy commands;
- produce a human-readable deploy report.

Do not bypass protected policies.
`;

const PROMPT_DISCOVERY_QUESTIONS = `# Discovery Questions

You are running the Discovery recipe for DELIVERATOR.

Your task:
- understand the user-visible goal;
- inspect the repository structure;
- identify ambiguities, hidden constraints, and missing inputs;
- produce \`artifacts/current/discovery_questions.md\`.

Rules:
- ask only questions that materially affect design or implementation;
- prefer grouped, concise questions;
- mention the code areas likely involved;
- if the user already answered something in comments or attachments, do not ask again;
- do not implement code in this step.
`;

const PROMPT_FEEDBACK_APPLY = `# Feedback Apply

Apply the latest human feedback to the current task workspace.

Rules:
- treat comments, screenshots, and attachments as canonical input;
- update specs if the feedback changes task intent;
- if the feedback materially changes the planned behavior, make that visible in the feedback delta.
`;

const PROMPT_RESEARCH_EXECPLAN = `# Research ExecPlan

You are generating the canonical ExecPlan artifact.

Treat ExecPlan as a workflow-configured artifact recipe, not as an implicit built-in.
If a personal ExecPlan skill is available through profile resolution, follow it.

Requirements:
- write a self-contained living document;
- make it understandable for a novice in this repository;
- include purpose, context, plan of work, concrete steps, validation, recovery, and decision log;
- update the entire document coherently when revising it.

Write the result to \`artifacts/current/execplan.md\`.
`;

const PROMPT_RESEARCH_OPENSPEC = `# Research OpenSpec

You are generating or revising OpenSpec artifacts for the current task.

Requirements:
- use the current task description, comments, and ExecPlan;
- produce artifacts that can drive implementation and verification;
- keep planning artifacts aligned with the real scope of the task;
- do not start implementation in this step unless the project-specific instructions explicitly require it.
`;

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const VALIDATOR_BUILDTEST_RULES = `# BuildTest Rules

The BuildTest stage should only auto-complete when:

- all known OpenSpec items are closed;
- unit tests pass;
- integration tests pass;
- e2e tests pass, or an explicit waiver exists;
- the development environment boots successfully;
- the latest review report has no blockers.

If no progress is made across repeated iterations, the stage must stop and request human input.
`;

export function buildDefaultProjectYaml(projectName: string, projectSlug: string): string {
  return `version: 1
name: ${projectName}
slug: ${projectSlug}
`;
}

// ---------------------------------------------------------------------------
// File manifest — relative paths under `<project>/.deliverator/shared/`
// ---------------------------------------------------------------------------

export const DEFAULT_PRODUCT_FILES: ReadonlyArray<{ path: string; content: string }> = [
  // Workflow
  { path: "workflow.yaml", content: DEFAULT_WORKFLOW_YAML },
  { path: "project.yaml", content: buildDefaultProjectYaml("Project", "project") },

  // Recipes
  { path: "recipes/build.loop.yml", content: RECIPE_BUILD_LOOP },
  { path: "recipes/deploy.finalize.yml", content: RECIPE_DEPLOY_FINALIZE },
  { path: "recipes/discovery.questions.yml", content: RECIPE_DISCOVERY_QUESTIONS },
  { path: "recipes/feedback.apply.yml", content: RECIPE_FEEDBACK_APPLY },
  { path: "recipes/research.execplan.yml", content: RECIPE_RESEARCH_EXECPLAN },
  { path: "recipes/research.openspec.yml", content: RECIPE_RESEARCH_OPENSPEC },

  // Schemas
  { path: "schemas/action-result.schema.json", content: SCHEMA_ACTION_RESULT },
  { path: "schemas/recipe.schema.json", content: SCHEMA_RECIPE },
  { path: "schemas/run-manifest.schema.json", content: SCHEMA_RUN_MANIFEST },
  { path: "schemas/stage-result.schema.json", content: SCHEMA_STAGE_RESULT },
  { path: "schemas/workflow.schema.json", content: SCHEMA_WORKFLOW },

  // Prompts — build stage
  { path: "prompts/build/implement.system.md", content: PROMPT_BUILD_IMPLEMENT },
  { path: "prompts/build/review_fix.system.md", content: PROMPT_BUILD_REVIEW_FIX },
  { path: "prompts/build/review.system.md", content: PROMPT_BUILD_REVIEW },
  { path: "prompts/build/simplify.system.md", content: PROMPT_BUILD_SIMPLIFY },
  { path: "prompts/build/tests_and_fixes.system.md", content: PROMPT_BUILD_TESTS_AND_FIXES },

  // Prompts — deploy stage
  { path: "prompts/deploy/finalize.system.md", content: PROMPT_DEPLOY_FINALIZE },

  // Prompts — discovery stage
  { path: "prompts/discovery/questions.system.md", content: PROMPT_DISCOVERY_QUESTIONS },

  // Prompts — feedback stage
  { path: "prompts/feedback/apply.system.md", content: PROMPT_FEEDBACK_APPLY },

  // Prompts — research stage
  { path: "prompts/research/execplan.system.md", content: PROMPT_RESEARCH_EXECPLAN },
  { path: "prompts/research/openspec.system.md", content: PROMPT_RESEARCH_OPENSPEC },

  // Validators
  { path: "validators/buildtest.rules.md", content: VALIDATOR_BUILDTEST_RULES }
];
