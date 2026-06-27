import { describe, it, expect } from "vitest";
import { displayWeatherForecastTool } from "./display-weather-forecast-tool";

describe("displayWeatherForecastTool", () => {
  it("generates weather data for a given location", async () => {
    const result = await displayWeatherForecastTool.execute(
      { location: "Tokyo" },
      { toolCallId: "test-1", messages: [] },
    );

    expect(result.location).toBe("Tokyo");
    expect(typeof result.temperature).toBe("number");
    expect(typeof result.feelsLike).toBe("number");
    expect(typeof result.condition).toBe("string");
    expect(typeof result.humidity).toBe("number");
    expect(typeof result.windSpeed).toBe("number");
    expect(result.forecast).toHaveLength(5);
  });

  it("returns deterministic results for the same location", async () => {
    const firstResult = await displayWeatherForecastTool.execute(
      { location: "Paris" },
      { toolCallId: "test-2", messages: [] },
    );

    const secondResult = await displayWeatherForecastTool.execute(
      { location: "Paris" },
      { toolCallId: "test-3", messages: [] },
    );

    expect(firstResult.temperature).toBe(secondResult.temperature);
    expect(firstResult.condition).toBe(secondResult.condition);
  });

  it("returns different results for different locations", async () => {
    const tokyoResult = await displayWeatherForecastTool.execute(
      { location: "Tokyo" },
      { toolCallId: "test-4", messages: [] },
    );

    const londonResult = await displayWeatherForecastTool.execute(
      { location: "London" },
      { toolCallId: "test-5", messages: [] },
    );

    expect(tokyoResult.temperature).not.toBe(londonResult.temperature);
  });

  it("includes five-day forecast with day names", async () => {
    const result = await displayWeatherForecastTool.execute(
      { location: "Berlin" },
      { toolCallId: "test-6", messages: [] },
    );

    expect(result.forecast).toHaveLength(5);
    result.forecast.forEach((day) => {
      expect(typeof day.day).toBe("string");
      expect(typeof day.high).toBe("number");
      expect(typeof day.low).toBe("number");
      expect(day.high).toBeGreaterThan(day.low);
    });
  });
});
