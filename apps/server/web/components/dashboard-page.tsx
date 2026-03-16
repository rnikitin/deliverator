import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  ATTENTION_BADGE_COLORS,
  ATTENTION_BADGE_FALLBACK,
  ATTENTION_LABELS,
  STAGE_BAR_COLORS,
  STAGE_DOT_COLORS,
  STAGE_LABELS
} from "../lib/board-styles.js";
import { cn, relativeTime, titleCase } from "../lib/utils.js";
import { useDashboard } from "../hooks/use-dashboard.js";
import { useFeed } from "../hooks/use-feed.js";
import type { FeedEvent } from "../hooks/use-feed.js";
import { buildTaskOverlaySearch } from "../lib/task-overlay.js";

const ATTENTION_FILTERS = [
  "blocked",
  "awaiting_human_input",
  "awaiting_human_approval",
  "ready_for_feedback"
] as const;

const STAGE_ORDER = [
  "inbox", "discovery", "research", "build_test", "feedback", "deploy", "done"
] as const;

function ct(counts: Record<string, number>, key: string): number {
  return counts[key] ?? 0;
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function FeedRow({ event }: { event: FeedEvent }) {
  const location = useLocation();
  const href = {
    pathname: location.pathname,
    search: buildTaskOverlaySearch(location.search, event.projectSlug, event.taskId)
  };

  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <span className="h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden />
      <span className="font-body text-sm font-medium text-foreground">
        {event.projectName}
      </span>
      <span className="font-body text-sm text-muted-foreground">
        {titleCase(event.type)}
      </span>
      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
        {relativeTime(event.createdAt)}
      </span>
      <Link
        to={href}
        className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary hover:underline"
      >
        {event.taskId}
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const dashboard = useDashboard();
  const feed = useFeed();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  if (dashboard.isLoading || feed.isLoading) {
    return (
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (dashboard.error || !dashboard.data) {
    return (
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 font-mono text-sm text-destructive">Failed to load dashboard.</p>
      </div>
    );
  }

  const { counts, actionableItems } = dashboard.data;
  const events = feed.data ?? [];

  const totalProjects = ct(counts, "projects");
  const totalTasks = ct(counts, "tasks");

  // Attention metrics for filter chips
  const attentionChips = ATTENTION_FILTERS.map((state) => ({
    state,
    label: ATTENTION_LABELS[state] ?? titleCase(state),
    value: ct(counts, `attention:${state}`)
  }));

  // Pipeline stages
  const stages = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage] ?? titleCase(stage),
    value: ct(counts, `stage:${stage}`),
    dot: STAGE_DOT_COLORS[stage] ?? "bg-muted-foreground",
    bar: STAGE_BAR_COLORS[stage] ?? "hsl(var(--muted-foreground))"
  }));
  const totalStaged = stages.reduce((s, m) => s + m.value, 0);

  // Map taskId -> attentionState for feed filtering (memoized)
  const taskAttention = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of actionableItems) {
      map.set(`${item.projectSlug}:${item.taskId}`, item.attentionState);
    }
    return map;
  }, [actionableItems]);

  const filteredEvents = useMemo(
    () =>
      activeFilter
        ? events.filter(
            (e) => taskAttention.get(`${e.projectSlug}:${e.taskId}`) === activeFilter
          )
        : events,
    [events, activeFilter, taskAttention]
  );

  return (
    <div className="p-8">
      {/* ── Header + Pipeline ── */}
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {totalProjects} {totalProjects === 1 ? "project" : "projects"}
          </span>
          <span className="text-border/60">/</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </span>
        </div>
      </div>

      {/* Pipeline bar */}
      <div className="mt-4 border border-border bg-card px-5 py-3">
        <div className="flex h-2.5 w-full overflow-hidden bg-muted/50">
          {totalStaged > 0 &&
            stages.map(
              (m) =>
                m.value > 0 && (
                  <div
                    key={m.stage}
                    style={{
                      width: `${(m.value / totalStaged) * 100}%`,
                      backgroundColor: m.bar
                    }}
                    title={`${m.label}: ${m.value}`}
                  />
                )
            )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          {stages.map((m) => (
            <div key={m.stage} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 shrink-0", m.dot)} />
              <span className="font-mono text-[10px] text-muted-foreground">{m.label}</span>
              <span className="font-mono text-[10px] font-medium text-foreground">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Attention filters ── */}
      <div className="mt-4 flex flex-wrap gap-2">
        {attentionChips.map((m) => {
          const isActive = activeFilter === m.state;
          const hasItems = m.value > 0;

          return (
            <button
              key={m.state}
              type="button"
              onClick={() => hasItems && setActiveFilter(isActive ? null : m.state)}
              disabled={!hasItems}
              className={cn(
                "inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive && "border-transparent",
                isActive &&
                  (ATTENTION_BADGE_COLORS[m.state] ?? ATTENTION_BADGE_FALLBACK),
                !isActive &&
                  hasItems &&
                  "border-border bg-card text-foreground hover:bg-accent",
                !isActive &&
                  !hasItems &&
                  "cursor-default border-border/50 bg-card text-muted-foreground/40"
              )}
            >
              <span className="font-display text-xs">{m.value}</span>
              {m.label}
            </button>
          );
        })}
        {activeFilter && (
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className="border border-border bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Feed ── */}
      <section className="mt-4 border border-border bg-card">
        {filteredEvents.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="font-body text-sm text-muted-foreground">
              {activeFilter ? "No events match this filter." : "No events yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredEvents.map((event) => (
              <FeedRow
                key={`${event.projectSlug}:${event.id}`}
                event={event}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
