/** Shared color/label maps for attention states and stages. Single source of truth. */

export const ATTENTION_BADGE_FALLBACK = "bg-muted text-muted-foreground";

export const ATTENTION_BADGE_COLORS: Record<string, string> = {
  actively_working: "bg-state-working text-white",
  awaiting_human_input: "bg-state-input text-white",
  awaiting_human_approval: "bg-state-approval text-white",
  blocked: "bg-state-blocked text-white",
  ready_for_feedback: "bg-state-feedback text-white",
  ready_to_archive: "bg-state-archive text-white",
  paused_for_human: "bg-state-paused text-white"
};

export const ATTENTION_LABELS: Record<string, string> = {
  actively_working: "WORKING",
  awaiting_human_input: "NEEDS INPUT",
  awaiting_human_approval: "NEEDS APPROVAL",
  blocked: "BLOCKED",
  ready_for_feedback: "READY FOR REVIEW",
  ready_to_archive: "ARCHIVE",
  paused_for_human: "PAUSED"
};

export const ATTENTION_BORDER_COLORS: Record<string, string> = {
  actively_working: "border-l-state-working",
  awaiting_human_input: "border-l-state-input",
  awaiting_human_approval: "border-l-state-approval",
  blocked: "border-l-state-blocked",
  ready_for_feedback: "border-l-state-feedback",
  ready_to_archive: "border-l-state-archive",
  paused_for_human: "border-l-state-paused"
};

export const STAGE_HEADER_COLORS: Record<string, string> = {
  inbox: "border-b-stage-inbox",
  discovery: "border-b-stage-discovery",
  research: "border-b-stage-research",
  build_test: "border-b-stage-build",
  feedback: "border-b-stage-feedback",
  deploy: "border-b-stage-deploy",
  done: "border-b-stage-done"
};

export const STAGE_DOT_COLORS: Record<string, string> = {
  inbox: "bg-stage-inbox",
  discovery: "bg-stage-discovery",
  research: "bg-stage-research",
  build_test: "bg-stage-build",
  feedback: "bg-stage-feedback",
  deploy: "bg-stage-deploy",
  done: "bg-stage-done"
};

export const STAGE_LABELS: Record<string, string> = {
  inbox: "Inbox",
  discovery: "Discovery",
  research: "Research",
  build_test: "Build",
  feedback: "Feedback",
  deploy: "Deploy",
  done: "Done"
};

export const STAGE_BAR_COLORS: Record<string, string> = {
  inbox: "hsl(var(--stage-inbox))",
  discovery: "hsl(var(--stage-discovery))",
  research: "hsl(var(--stage-research))",
  build_test: "hsl(var(--stage-build))",
  feedback: "hsl(var(--stage-feedback))",
  deploy: "hsl(var(--stage-deploy))",
  done: "hsl(var(--stage-done))"
};
