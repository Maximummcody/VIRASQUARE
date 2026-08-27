import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("ViraSquare Light Signal V identity", () => {
  it("uses the approved vector mark and restrained Navy-and-Electric-Blue wordmark on public screens", () => {
    const logo = readFileSync(resolve(projectRoot, "client/src/components/ViraSquareLogo.tsx"), "utf8");
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

    expect(logo).toContain('fill="#0B1220"');
    expect(logo).toContain('fill="#2563EB"');
    expect(logo).toContain('>Vira</span><span className="text-[#2563EB]">Square</span>');
    expect(home).toContain('import { ViraSquareLogo } from "@/components/ViraSquareLogo"');
    expect(home).toContain('return <ViraSquareLogo small={small} />');
  });

  it("keeps the workspace header structure while using the actual final mark component", () => {
    const workspace = readFileSync(resolve(projectRoot, "client/src/components/WorkspaceShell.tsx"), "utf8");

    expect(workspace).toContain('import { ViraSquareLogo } from "./ViraSquareLogo"');
    expect(workspace).toContain('<ViraSquareLogo small />');
    expect(workspace).toContain('aria-label="ViraSquare home"');
  });
});
