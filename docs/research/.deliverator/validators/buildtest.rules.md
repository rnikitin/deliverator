# BuildTest Rules

The BuildTest stage should only auto-complete when:

- all known OpenSpec items are closed;
- unit tests pass;
- integration tests pass;
- e2e tests pass, or an explicit waiver exists;
- the development environment boots successfully;
- the latest review report has no blockers.

If no progress is made across repeated iterations, the stage must stop and request human input.
