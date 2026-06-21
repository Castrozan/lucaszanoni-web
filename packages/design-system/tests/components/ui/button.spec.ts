import { describe, expect, it } from "vitest";
import { buttonVariants } from "../../../src/components/ui/button";

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

  it("emits the uppercase yellow contract for the brand variant", () => {
    const classes = buttonVariants({ variant: "brand" });
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("uppercase");
    expect(classes).toContain("hover:bg-[var(--ls-color-text-primary)]");
  });

  it("emits the bordered terminal outline for the terminal variant", () => {
    const classes = buttonVariants({ variant: "terminal" });
    expect(classes).toContain("border-2");
    expect(classes).toContain("uppercase");
    expect(classes).not.toContain("bg-primary");
  });
});
