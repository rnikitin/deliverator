import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { initializeProductConfig } from "../src/index.js";

const createdDirs: string[] = [];

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("initializeProductConfig", () => {
  it("creates all default product config files", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-init-"));
    createdDirs.push(tempDir);

    initializeProductConfig(tempDir);

    const base = path.join(tempDir, ".deliverator");
    expect(fs.existsSync(path.join(base, "workflow.yaml"))).toBe(true);
    expect(fs.existsSync(path.join(base, "recipes", "build.loop.yml"))).toBe(true);
    expect(fs.existsSync(path.join(base, "recipes", "deploy.finalize.yml"))).toBe(true);
    expect(fs.existsSync(path.join(base, "recipes", "discovery.questions.yml"))).toBe(true);
    expect(fs.existsSync(path.join(base, "recipes", "feedback.apply.yml"))).toBe(true);
    expect(fs.existsSync(path.join(base, "recipes", "research.execplan.yml"))).toBe(true);
    expect(fs.existsSync(path.join(base, "recipes", "research.openspec.yml"))).toBe(true);
    expect(fs.existsSync(path.join(base, "schemas", "action-result.schema.json"))).toBe(true);
    expect(fs.existsSync(path.join(base, "schemas", "recipe.schema.json"))).toBe(true);
    expect(fs.existsSync(path.join(base, "schemas", "run-manifest.schema.json"))).toBe(true);
    expect(fs.existsSync(path.join(base, "schemas", "stage-result.schema.json"))).toBe(true);
    expect(fs.existsSync(path.join(base, "schemas", "workflow.schema.json"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "build", "implement.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "build", "review.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "build", "review_fix.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "build", "simplify.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "build", "tests_and_fixes.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "deploy", "finalize.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "discovery", "questions.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "feedback", "apply.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "research", "execplan.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "prompts", "research", "openspec.system.md"))).toBe(true);
    expect(fs.existsSync(path.join(base, "validators", "buildtest.rules.md"))).toBe(true);
  });

  it("does not overwrite existing files", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-init-"));
    createdDirs.push(tempDir);

    const base = path.join(tempDir, ".deliverator");
    fs.mkdirSync(base, { recursive: true });
    const customContent = "# My custom workflow\nversion: 99\n";
    fs.writeFileSync(path.join(base, "workflow.yaml"), customContent, "utf8");

    initializeProductConfig(tempDir);

    const afterInit = fs.readFileSync(path.join(base, "workflow.yaml"), "utf8");
    expect(afterInit).toBe(customContent);

    // Other files should still be created
    expect(fs.existsSync(path.join(base, "recipes", "build.loop.yml"))).toBe(true);
  });

  it("is idempotent — calling twice produces the same result", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-init-"));
    createdDirs.push(tempDir);

    initializeProductConfig(tempDir);
    const firstContent = fs.readFileSync(
      path.join(tempDir, ".deliverator", "workflow.yaml"),
      "utf8"
    );

    initializeProductConfig(tempDir);
    const secondContent = fs.readFileSync(
      path.join(tempDir, ".deliverator", "workflow.yaml"),
      "utf8"
    );

    expect(secondContent).toBe(firstContent);
  });

  it("workflow.yaml content is valid YAML that compileWorkflowYaml can parse", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-init-"));
    createdDirs.push(tempDir);

    initializeProductConfig(tempDir);

    const { compileWorkflowYaml } = await import("../src/workflow.js");
    const content = fs.readFileSync(
      path.join(tempDir, ".deliverator", "workflow.yaml"),
      "utf8"
    );
    const workflow = compileWorkflowYaml(content);

    expect(workflow.stages).toHaveLength(7);
    expect(workflow.stages[0]?.id).toBe("inbox");
    expect(workflow.stages[6]?.id).toBe("done");
  });

  it("schema files contain valid JSON", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deliverator-init-"));
    createdDirs.push(tempDir);

    initializeProductConfig(tempDir);

    const schemasDir = path.join(tempDir, ".deliverator", "schemas");
    const schemaFiles = fs.readdirSync(schemasDir);

    expect(schemaFiles.length).toBe(5);
    for (const file of schemaFiles) {
      const content = fs.readFileSync(path.join(schemasDir, file), "utf8");
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });
});
