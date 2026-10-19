import { it, expect } from "vitest";

it("uses the redirect mode implemented by the Workers runtime", () => {
  expect(() => new Request("https://example.com/", { redirect: "error" })).toThrow(TypeError);
  expect(new Request("https://example.com/", { redirect: "manual" }).redirect).toBe("manual");
});
