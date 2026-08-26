import { describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ permanentlyDeleteExpiredProducts: vi.fn() }));

vi.mock("./db", () => database);

import { expireArchivedProducts } from "./productArchiveExpiry";

describe("product archive expiry cleanup", () => {
  it("uses the supplied cutoff and reports only the products permanently expired in that run", async () => {
    const now = new Date("2026-09-25T03:00:00.000Z");
    database.permanentlyDeleteExpiredProducts.mockResolvedValue(2);

    await expect(expireArchivedProducts(now)).resolves.toEqual({ permanentlyDeleted: 2, processedAt: "2026-09-25T03:00:00.000Z" });
    expect(database.permanentlyDeleteExpiredProducts).toHaveBeenCalledWith(now);
  });
});
