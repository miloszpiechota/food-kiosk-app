import { describe, expect, it } from "vitest";
import { formatPrice } from "./formatPrice";

describe("formatPrice", () => {
  it("formats cents as display currency", () => {
    expect(formatPrice(1299)).toBe("$12.99");
  });
});
