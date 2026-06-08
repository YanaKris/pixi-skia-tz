import { describe, it, expect } from "vitest";
import { add } from "../../util/add";

describe("tooling", () => {
  it("vitest runs TypeScript and recognizes src folder", () => {
    expect(add(2, 3)).toBe(5);
  });
});
