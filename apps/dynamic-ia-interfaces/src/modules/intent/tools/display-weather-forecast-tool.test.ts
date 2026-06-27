import { describe, it, expect } from "vitest";
import { generateWeatherForecastForLocation } from "./display-weather-forecast-tool";

describe("generateWeatherForecastForLocation", () => {
  it("generates weather data for a given location", () => {
    const result = generateWeatherForecastForLocation("Tokyo");

    expect(result.location).toBe("Tokyo");
    expect(typeof result.temperature).toBe("number");
    expect(typeof result.feelsLike).toBe("number");
    expect(typeof result.condition).toBe("string");
    expect(typeof result.humidity).toBe("number");
    expect(typeof result.windSpeed).toBe("number");
    expect(result.forecast).toHaveLength(5);
  });

  it("returns deterministic results for the same location", () => {
    const firstResult = generateWeatherForecastForLocation("Paris");
    const secondResult = generateWeatherForecastForLocation("Paris");

    expect(firstResult.temperature).toBe(secondResult.temperature);
    expect(firstResult.condition).toBe(secondResult.condition);
  });

  it("returns different results for different locations", () => {
    const tokyoResult = generateWeatherForecastForLocation("Tokyo");
    const londonResult = generateWeatherForecastForLocation("London");

    expect(tokyoResult.temperature).not.toBe(londonResult.temperature);
  });

  it("includes five-day forecast with day names", () => {
    const result = generateWeatherForecastForLocation("Berlin");

    expect(result.forecast).toHaveLength(5);
    result.forecast.forEach((day) => {
      expect(typeof day.day).toBe("string");
      expect(typeof day.high).toBe("number");
      expect(typeof day.low).toBe("number");
      expect(day.high).toBeGreaterThan(day.low);
    });
  });
});
