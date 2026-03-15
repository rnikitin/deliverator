# public-repo Specification

## Purpose
TBD - created by archiving change public-repo-readiness. Update Purpose after archive.
## Requirements
### Requirement: DELIVERATOR SHALL present a public-readable repository surface

The repository SHALL provide public-facing documentation that explains what the project is, what exists today, and how a contributor can work with it, without exposing personal local-machine references.

#### Scenario: Public docs do not expose personal filesystem paths
- **WHEN** a contributor reads the public-facing repository docs
- **THEN** the docs do not contain personal absolute filesystem paths such as `/Users/<name>/...`
- **AND** the docs do not depend on local Codex or Claude skill file paths to make sense

#### Scenario: README explains the project to an external reader
- **WHEN** a contributor opens `README.md`
- **THEN** the file explains what DELIVERATOR is
- **AND** describes the current foundation-level state of the repository
- **AND** explains how to run the project locally

### Requirement: DELIVERATOR SHALL provide contribution guidance

The repository SHALL include root-level contributor documentation that explains how to contribute safely and consistently.

#### Scenario: CONTRIBUTING guidance exists
- **WHEN** a contributor looks for contribution instructions
- **THEN** a root `CONTRIBUTING.md` file exists
- **AND** it explains the planning tiers, when ExecPlan is required, when OpenSpec is required, and which validation commands are expected

### Requirement: DELIVERATOR SHALL declare a public license

The repository SHALL include a root license file that grants external users clear rights to use, fork, and modify the repository.

#### Scenario: License file exists at the repository root
- **WHEN** a contributor inspects the repository root
- **THEN** a `LICENSE` file exists
- **AND** the license text clearly defines reuse and modification terms

