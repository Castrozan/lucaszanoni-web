import { describe, expect, it } from "vitest";
import { generatedComponentSpecificationSchema } from "./types";

describe("generatedComponentSpecificationSchema", () => {
  it("validates a correct component specification", () => {
    const validSpecification = {
      componentName: "WeatherDashboard",
      title: "Weather Dashboard",
      description: "Shows current weather and forecast",
      imports: [{ module: "react", namedExports: ["useState", "useEffect"] }],
      props: [
        { name: "city", type: "string", required: true },
        { name: "units", type: "string", required: false },
      ],
      jsxCode: "function App() { return <div>Weather</div>; }",
      dependencies: [],
      tier: "freeform" as const,
    };

    const result =
      generatedComponentSpecificationSchema.safeParse(validSpecification);
    expect(result.success).toBe(true);
  });

  it("rejects a specification with missing required fields", () => {
    const invalidSpecification = {
      componentName: "Test",
      title: "Test",
    };

    const result =
      generatedComponentSpecificationSchema.safeParse(invalidSpecification);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid tier value", () => {
    const specificationWithInvalidTier = {
      componentName: "Test",
      title: "Test",
      description: "Test",
      imports: [],
      props: [],
      jsxCode: "",
      dependencies: [],
      tier: "invalid",
    };

    const result = generatedComponentSpecificationSchema.safeParse(
      specificationWithInvalidTier,
    );
    expect(result.success).toBe(false);
  });

  it("accepts all valid tier values", () => {
    const tiers = ["prebuilt", "template", "freeform"] as const;

    for (const tier of tiers) {
      const specification = {
        componentName: "Test",
        title: "Test",
        description: "Test",
        imports: [],
        props: [],
        jsxCode: "",
        dependencies: [],
        tier,
      };

      const result =
        generatedComponentSpecificationSchema.safeParse(specification);
      expect(result.success).toBe(true);
    }
  });
});
