import { describe, expect, it } from "vitest";
import { NAVY_PROOF_TOKENS } from "./DesignProof";

describe("Navy and Electric Blue design proof", () => {
  it("uses one signature blue accent with a light workspace and navy foundation", () => {
    expect(NAVY_PROOF_TOKENS).toEqual({ ink: "#0B1220", electricBlue: "#2563EB", skyBlue: "#60A5FA", paper: "#FFFFFF", workspace: "#F5F7FA", text: "#111827" });
  });
});
