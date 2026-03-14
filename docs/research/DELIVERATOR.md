# DELIVERATOR

This repository is controlled by DELIVERATOR.

Machine-readable runtime behavior lives in `.deliverator/workflow.yml`.
This file is the human-readable contract for how humans and agents work in this repository.

## Core principles

Work continuity lives in repository state, task workspaces, artifacts, logs, and pull request history.
Do not rely on prior chat history being available.

Every automated run should be reproducible from:

- current repository state;
- task metadata and comments;
- materialized attachments;
- canonical artifacts inside the task workspace;
- stage and recipe configuration.

## Default board

The default DELIVERATOR board is:

- Inbox
- Discovery
- Research
- BuildTest
- Feedback
- Deploy
- Done

A task may also have an `attention_state` such as:

- actively_working
- awaiting_human_input
- awaiting_human_approval
- blocked
- ready_for_feedback
- ready_to_archive

## Human controls

Humans control:

- moving a task from Inbox to Discovery;
- answering discovery questions;
- approving Research artifacts;
- deciding whether Feedback is complete;
- archiving a task after Deploy.

Humans may also add comments, screenshots, and attachments at any point.

## Required artifacts

The workflow should preserve these artifacts when relevant:

- discovery questions
- discovery answers
- ExecPlan
- OpenSpec artifacts
- build/test report
- review report
- feedback delta
- deploy report

## ExecPlan policy

ExecPlan is not a DELIVERATOR built-in concept.
It is a workflow-configured artifact recipe.

If this repository uses an ExecPlan step, the recipe must produce a self-contained, beginner-friendly living document that can guide a novice through implementation from the file alone.

The concrete ExecPlan implementation may resolve from a personal skill/profile, but the workflow must still declare:

- expected inputs
- expected outputs
- artifact path
- validation contract
- retry policy

## Build and test expectations

A build task is not complete because the code compiles.
DELIVERATOR should prefer the strongest project-appropriate validation bundle available.

Unless explicitly waived:

- unit tests should pass;
- integration tests should pass;
- end-to-end tests should pass;
- the dev environment should boot successfully;
- a human-readable report should be attached.

## Protected operations

Protected operations must be policy-gated.

Examples:

- production deploys
- destructive migrations
- protected branch writes
- force pushes
- automatic merges to main

## Prompting convention

Project prompts live under `.deliverator/prompts/`.
Workflow behavior should not be hardcoded in the orchestrator when it belongs in project policy.

If `.deliverator/workflow.yml` and this document disagree, `.deliverator/workflow.yml` controls runtime behavior and this file should be updated.
