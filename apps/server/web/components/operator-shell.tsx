import { useEffect, useState } from "react";
import { Link } from "react-router";

import { initBrowserTelemetry } from "../telemetry.js";

interface CompiledConfigSummary {
  stages: Array<{ id: string; label: string }>;
  app: {
    telemetry: {
      metricsPath: string;
    };
  };
}

export function OperatorShell() {
  const [configSummary, setConfigSummary] = useState<CompiledConfigSummary | null>(null);

  useEffect(() => {
    initBrowserTelemetry();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      const response = await fetch("/api/config/compiled");
      const payload = (await response.json()) as CompiledConfigSummary;

      if (mounted) {
        setConfigSummary(payload);
      }
    };

    void loadSummary();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">DELIVERATOR</span>
        <h1>One Fastify-hosted site for orchestration, evidence, and review.</h1>
        <p>
          This foundation release proves the runtime shape: deterministic workflow contracts, SQLite bootstrap,
          server-sent events, Prometheus metrics, and a local LGTM-style observability stack behind the same site.
        </p>
      </section>

      <section className="cards">
        <article className="card">
          <strong>Operator shell</strong>
          <p>The root page is rendered by the same Fastify server that exposes the API and SSE endpoints.</p>
        </article>
        <article className="card">
          <strong>Deterministic core</strong>
          <p>Workflow stages, compiled config, and seed data come from TypeScript packages rather than prompt text.</p>
        </article>
        <article className="card">
          <strong>Local observability</strong>
          <p>Grafana, Tempo, Prometheus, Loki, and Promtail are wired for local debugging through `make dev`.</p>
        </article>
      </section>

      <section className="cards">
        <article className="card">
          <strong>Compiled workflow</strong>
          <p>{configSummary ? `${configSummary.stages.length} stages loaded from the deterministic core.` : "Loading compiled config..."}</p>
        </article>
        <article className="card">
          <strong>Metrics surface</strong>
          <p>{configSummary ? `Prometheus metrics are exposed at ${configSummary.app.telemetry.metricsPath}.` : "Resolving runtime metrics path..."}</p>
        </article>
      </section>

      <div className="meta">
        <a href="/healthz">Health</a>
        <a href="/readyz">Readiness</a>
        <a href="/api/config/compiled">Compiled config</a>
        <a href="/api/metrics">Metrics</a>
        <Link to="/tasks/task-foundation">Example task</Link>
      </div>
    </main>
  );
}
