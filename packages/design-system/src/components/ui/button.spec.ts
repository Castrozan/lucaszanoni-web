import { describe, expect, it } from "vitest";
import { buttonVariants } from "./button";

describe("buttonVariants", () => {
  it("emits the primary surface classes for the default variant", () => {
    const classes = buttonVariants();
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("text-primary-foreground");
  });

  it("swaps to bordered outline classes for the outline variant", () => {
    const classes = buttonVariants({ variant: "outline" });
    expect(classes).toContain("border-input");
    expect(classes).not.toContain("bg-primary");
  });
});
