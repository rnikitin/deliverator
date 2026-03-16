import fs from "node:fs";

import type { CompiledWorkflow } from "@deliverator/contracts";
import { ensureDirectory, resolveProjectPaths, type ProjectPaths } from "@deliverator/shared";
import { parse as parseYaml } from "yaml";

import { DEFAULT_WORKFLOW_YAML } from "./defaults.js";

/** Shape of a single stage entry in the workflow YAML file. */
interface WorkflowYamlStage {
  title: string;
  mode: string;
  allowed_manual_moves_to?: string[];
  [key: string]: unknown;
}

/** Shape of the parsed workflow YAML file (only the fields we compile). */
interface WorkflowYaml {
  version: number;
  stages: Record<string, WorkflowYamlStage>;
  board?: { columns?: string[] };
}

/**
 * Load and compile the workflow YAML from disk. If the file does not exist,
 * auto-create it from the built-in default before compiling.
 *
 * @param input - Project root path or resolved project paths
 * @returns The compiled workflow (stages, allowed moves)
 */
export function loadAndCompileWorkflow(input: string | ProjectPaths): CompiledWorkflow {
  const projectPaths = typeof input === "string" ? resolveProjectPaths(input) : input;
  const workflowDir = projectPaths.sharedDir;
  const workflowPath = projectPaths.workflowFilePath;

  // Defensive fallback — initializeProductConfig normally creates this file at startup,
  // but this ensures loadAndCompileWorkflow works standalone (e.g. in tests or CLI tools that skip full init).
  if (!fs.existsSync(workflowPath)) {
    ensureDirectory(workflowDir);
    fs.writeFileSync(workflowPath, DEFAULT_WORKFLOW_YAML, "utf8");
  }

  const raw = fs.readFileSync(workflowPath, "utf8");
  return compileWorkflowYaml(raw);
}

/**
 * Compile a workflow YAML string into a CompiledWorkflow.
 * Exported for testing without filesystem.
 */
export function compileWorkflowYaml(yamlContent: string): CompiledWorkflow {
  const parsed = parseYaml(yamlContent) as WorkflowYaml;

  if (!parsed.stages || typeof parsed.stages !== "object") {
    throw new Error("Workflow YAML must have a 'stages' object");
  }

  const stageOrder = parsed.board?.columns ?? Object.keys(parsed.stages);

  const stages = stageOrder.map((id) => {
    const stageDef = parsed.stages[id];
    if (!stageDef) {
      throw new Error(`Stage '${id}' listed in board.columns but not defined in stages`);
    }
    const mode = normalizeMode(stageDef.mode);
    return { id, label: stageDef.title || id, mode };
  });

  const allowedMoves: Record<string, string[]> = {};
  for (const id of stageOrder) {
    const stageDef = parsed.stages[id];
    allowedMoves[id] = stageDef?.allowed_manual_moves_to ?? [];
  }

  return { stages, allowedMoves };
}

function normalizeMode(mode: string): "manual" | "automatic" | "hybrid" {
  switch (mode) {
    case "manual":
      return "manual";
    case "automated":
    case "automatic":
      return "automatic";
    case "hybrid":
      return "hybrid";
    case "terminal":
      return "manual";
    default:
      return "manual";
  }
}
