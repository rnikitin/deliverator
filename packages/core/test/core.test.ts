import { describe, expect, it } from "vitest";

import { buildCompiledConfig, compileWorkflowYaml, createBootstrapProject, listInitialTasks } from "../src/index.js";

const testWorkflow = compileWorkflowYaml(`
version: 1
board:
  columns:
    - inbox
    - discovery
    - done
stages:
  inbox:
    title: Inbox
    mode: manual
    allowed_manual_moves_to:
      - discovery
  discovery:
    title: Discovery
    mode: hybrid
  done:
    title: Done
    mode: terminal
`);

describe("core", () => {
  it("builds a compiled config with workflow data", () => {
    const compiled = buildCompiledConfig(
      {
        nodeEnv: "development",
        port: 3000,
        paths: {
          dataDir: "/tmp/data",
          worktreeDir: "/tmp/worktrees",
          logsDir: "/tmp/logs"
        },
        telemetry: {
          serviceName: "deliverator-server",
          otlpEndpoint: "http://localhost:4318",
          browserTracingEnabled: true,
          metricsPath: "/api/metrics"
        }
      },
      testWorkflow
    );

    expect(compiled.workflow.stages).toHaveLength(3);
    expect(compiled.workflow.stages[0]?.id).toBe("inbox");
    expect(compiled.workflow.allowedMoves["inbox"]).toEqual(["discovery"]);
    expect(compiled.operatorShell.title).toBe("DELIVERATOR");
  });

  it("derives bootstrap records with valid stage and attention values", () => {
    const project = createBootstrapProject("/tmp/repo");
    const tasks = listInitialTasks(project.id);

    expect(tasks.length).toBeGreaterThan(1);
    expect(tasks[0]?.projectId).toBe(project.id);
    expect(tasks[0]?.stage).toBe("build_test");
    expect(tasks[0]?.attentionState).toBe("actively_working");
  });
});

describe("workflow compiler", () => {
  it("compiles a minimal workflow YAML", () => {
    const workflow = compileWorkflowYaml(`
version: 1
stages:
  inbox:
    title: Inbox
    mode: manual
    allowed_manual_moves_to:
      - done
  done:
    title: Done
    mode: terminal
`);

    expect(workflow.stages).toHaveLength(2);
    expect(workflow.stages[0]?.id).toBe("inbox");
    expect(workflow.stages[0]?.label).toBe("Inbox");
    expect(workflow.stages[0]?.mode).toBe("manual");
    expect(workflow.stages[1]?.id).toBe("done");
    expect(workflow.allowedMoves["inbox"]).toEqual(["done"]);
    expect(workflow.allowedMoves["done"]).toEqual([]);
  });

  it("respects board.columns order", () => {
    const workflow = compileWorkflowYaml(`
version: 1
board:
  columns:
    - done
    - inbox
stages:
  inbox:
    title: Inbox
    mode: manual
  done:
    title: Done
    mode: terminal
`);

    expect(workflow.stages[0]?.id).toBe("done");
    expect(workflow.stages[1]?.id).toBe("inbox");
  });

  it("throws on missing stage definition", () => {
    expect(() =>
      compileWorkflowYaml(`
version: 1
board:
  columns:
    - missing
stages:
  inbox:
    title: Inbox
    mode: manual
`)
    ).toThrow("Stage 'missing' listed in board.columns but not defined in stages");
  });

  it("normalizes mode values", () => {
    const workflow = compileWorkflowYaml(`
version: 1
stages:
  s1:
    title: S1
    mode: automated
  s2:
    title: S2
    mode: terminal
`);

    expect(workflow.stages[0]?.mode).toBe("automatic");
    expect(workflow.stages[1]?.mode).toBe("manual");
  });
});
