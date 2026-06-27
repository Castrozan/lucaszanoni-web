import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { roadmapCapabilities } from "../src/landing/landingContent";
import { RoadmapHintStrip } from "../src/landing/RoadmapHintStrip";

afterEach(cleanup);

describe("RoadmapHintStrip", () => {
  it("renders every capability with a shipped or planned badge", () => {
    render(<RoadmapHintStrip />);
    for (const capability of roadmapCapabilities) {
      expect(screen.getByText(capability.label)).toBeTruthy();
    }
    const shippedCount = roadmapCapabilities.filter(
      (capability) => capability.status === "shipped",
    ).length;
    expect(screen.getAllByText("Shipped").length).toBe(shippedCount);
    expect(screen.getAllByText("Planned").length).toBe(
      roadmapCapabilities.length - shippedCount,
    );
  });
});
