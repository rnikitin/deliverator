-- Migrate placeholder stage values to research-defined stages
UPDATE tasks SET stage = 'inbox' WHERE stage = 'triage';
UPDATE tasks SET stage = 'discovery' WHERE stage = 'ready';
UPDATE tasks SET stage = 'build_test' WHERE stage = 'in_progress';
UPDATE tasks SET stage = 'feedback' WHERE stage = 'review';
UPDATE tasks SET stage = 'inbox', attention_state = 'blocked' WHERE stage = 'blocked';

-- Migrate placeholder attention state values to research-defined attention states
UPDATE tasks SET attention_state = 'actively_working' WHERE attention_state = 'normal';
UPDATE tasks SET attention_state = 'awaiting_human_input' WHERE attention_state = 'needs_human';
UPDATE tasks SET attention_state = 'paused_for_human' WHERE attention_state = 'waiting_on_dependency';
UPDATE tasks SET attention_state = 'blocked' WHERE attention_state = 'failed';

-- Migrate stage values in runs table
UPDATE runs SET stage = 'inbox' WHERE stage = 'triage';
UPDATE runs SET stage = 'discovery' WHERE stage = 'ready';
UPDATE runs SET stage = 'build_test' WHERE stage = 'in_progress';
UPDATE runs SET stage = 'feedback' WHERE stage = 'review';
