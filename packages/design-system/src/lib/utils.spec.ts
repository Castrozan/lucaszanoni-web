import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class fragments and drops falsy ones", () => {
    expect(cn("inline-flex", false, undefined, "items-center")).toBe(
      "inline-flex items-center",
    );
  });

  it("lets a later Tailwind utility win over an earlier conflicting one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
