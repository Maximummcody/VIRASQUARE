import { describe, expect, it } from "vitest";

import { searchSavedProducts } from "../client/src/lib/productPicker";

describe("searchSavedProducts", () => {
  const products = [
    { id: 1, name: "Fashion Handbag for Women", price: "35000" },
    { id: 2, name: "Everyday G-shock watch", price: "45000" },
    { id: 3, name: "Silk head scarf", price: null },
  ];

  it("returns every product before an owner searches", () => {
    expect(searchSavedProducts(products, "")).toHaveLength(3);
  });

  it("matches saved product names and prices without case sensitivity", () => {
    expect(searchSavedProducts(products, "g-SHOCK").map(product => product.id)).toEqual([2]);
    expect(searchSavedProducts(products, "35000").map(product => product.id)).toEqual([1]);
  });

  it("returns no products when a saved product does not match", () => {
    expect(searchSavedProducts(products, "wallet")).toEqual([]);
  });
});
