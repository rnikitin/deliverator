## ADDED Requirements

### Requirement: Contracts SHALL define Stage as a string type

The `StageSchema` in `packages/contracts/src/index.ts` SHALL be `Type.String()`. The exported `Stage` type SHALL resolve to `string`. Concrete stage values are not defined in contracts — they come from `.deliverator/workflow.yaml` compiled at server startup. No package SHALL hardcode stage literals as type-level constants in contracts.

#### Scenario: Stage type accepts any string value
- **WHEN** a TypeScript file imports `Stage` from `@deliverator/contracts`
- **THEN** the type accepts any string value (e.g., `"inbox"`, `"custom_stage"`)

#### Scenario: Stage schema validates any string
- **WHEN** `validateSchema(StageSchema, "build_test")` is called
- **THEN** the function returns `true`

#### Scenario: Stage schema rejects non-string values
- **WHEN** `validateSchema(StageSchema, 42)` is called
- **THEN** the function returns `false`

### Requirement: Contracts SHALL define 7 attention states as a fixed union

The `AttentionStateSchema` in `packages/contracts/src/index.ts` SHALL be a TypeBox union of exactly 7 string literals: `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`. The exported `AttentionState` type SHALL resolve to this union. Attention states are system-level concepts and are not configurable via workflow YAML.

#### Scenario: AttentionState type includes all 7 values
- **WHEN** a TypeScript file imports `AttentionState` from `@deliverator/contracts`
- **THEN** the type accepts exactly the values `actively_working`, `awaiting_human_input`, `awaiting_human_approval`, `blocked`, `ready_for_feedback`, `ready_to_archive`, `paused_for_human`
- **AND** the TypeScript compiler rejects any other string value assigned to an `AttentionState` variable

#### Scenario: AttentionState schema rejects old placeholder values
- **WHEN** `validateSchema(AttentionStateSchema, "needs_human")` is called
- **THEN** the function returns `false`

### Requirement: Contracts SHALL export attention state metadata

The contracts package SHALL export an `ATTENTION_STATES` constant array containing all 7 attention states. Each entry SHALL include the state `id` and a human-readable `label`. This is the only vocabulary metadata constant exported from contracts — stage metadata comes from the compiled workflow config in `packages/core`.

#### Scenario: ATTENTION_STATES array provides state metadata
- **WHEN** a module imports `ATTENTION_STATES` from `@deliverator/contracts`
- **THEN** `ATTENTION_STATES` is an array of 7 objects
- **AND** each entry has `id` (matching an `AttentionState` value) and `label` (a human-readable string)
- **AND** one entry has `id` equal to `"blocked"` and `label` equal to `"Blocked"`

### Requirement: Contracts SHALL NOT export stage constants or allowed moves

The contracts package SHALL NOT export `STAGES`, `ALLOWED_MOVES`, or any other constants that enumerate stage values or define stage transitions. Stage vocabulary and transition rules are workflow-configurable and come from `.deliverator/workflow.yaml` via the compiled workflow in `packages/core`.

#### Scenario: No stage vocabulary constants in contracts
- **WHEN** a module inspects the exports of `@deliverator/contracts`
- **THEN** there is no exported `STAGES` constant
- **AND** there is no exported `ALLOWED_MOVES` constant

### Requirement: Contracts SHALL export workflow config schema types

The contracts package SHALL export TypeBox schema types describing the shape of a compiled workflow. This includes `CompiledStageSchema` (an object with `id: string`, `label: string`, `mode: string`) and `CompiledWorkflowSchema` (an object with `stages: array of CompiledStage`, `allowedMoves: record of string to array of string`). These schemas describe the shape that the workflow compiler in `packages/core` must produce, enabling runtime validation of compiled workflow data.

#### Scenario: CompiledWorkflowSchema validates a correct compiled workflow
- **WHEN** `validateSchema(CompiledWorkflowSchema, { stages: [{ id: "inbox", label: "Inbox", mode: "manual" }], allowedMoves: { inbox: ["discovery"] } })` is called
- **THEN** the function returns `true`

#### Scenario: CompiledWorkflowSchema rejects a malformed compiled workflow
- **WHEN** `validateSchema(CompiledWorkflowSchema, { stages: "not-an-array" })` is called
- **THEN** the function returns `false`
