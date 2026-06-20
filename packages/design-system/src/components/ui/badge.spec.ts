import { describe, expect, it } from "vitest";
import { badgeVariants } from "./badge";

describe("badgeVariants", () => {
  it("emits the primary surface classes for the default variant", () => {
    const classes = badgeVariants();
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("text-primary-foreground");
  });

  it("emits a bordered surface for the outline variant", () => {
    const classes = badgeVariants({ variant: "outline" });
    expect(classes).toContain("text-foreground");
    expect(classes).not.toContain("bg-primary");
  });

  it("emits the muted surface classes for the secondary variant", () => {
    const classes = badgeVariants({ variant: "secondary" });
    expect(classes).toContain("bg-secondary");
    expect(classes).toContain("text-secondary-foreground");
  });
});
