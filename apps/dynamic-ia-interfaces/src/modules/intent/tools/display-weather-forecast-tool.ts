import { tool } from "ai";
import { z } from "zod";

export const displayWeatherForecastToolOutputSchema = z.object({
  location: z.string(),
  temperature: z.number(),
  feelsLike: z.number(),
  condition: z.string(),
  humidity: z.number(),
  windSpeed: z.number(),
  windDirection: z.string(),
  forecast: z.array(
    z.object({
      day: z.string(),
      high: z.number(),
      low: z.number(),
      condition: z.string(),
    }),
  ),
});

export type DisplayWeatherForecastToolOutput = z.infer<
  typeof displayWeatherForecastToolOutputSchema
>;

export const displayWeatherForecastTool = tool({
  description:
    "Display a weather forecast card for a location. Use when the user asks about weather, temperature, forecast, or climate conditions.",
  inputSchema: z.object({
    location: z.string().describe("City name or location to get weather for"),
  }),
  execute: async function ({ location }) {
    const baseTemperature = generateDeterministicTemperatureForLocation(location);

    return {
      location,
      temperature: baseTemperature,
      feelsLike: baseTemperature - 2,
      condition: pickWeatherConditionFromTemperature(baseTemperature),
      humidity: 45 + ((hashStringToNumber(location) % 40)),
      windSpeed: 5 + (hashStringToNumber(location) % 20),
      windDirection: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
        hashStringToNumber(location) % 8
      ],
      forecast: generateFiveDayForecast(location, baseTemperature),
    };
  },
});

function generateDeterministicTemperatureForLocation(location: string): number {
  const hash = hashStringToNumber(location);
  return 15 + (hash % 25);
}

function pickWeatherConditionFromTemperature(temperature: number): string {
  if (temperature > 30) return "Sunny";
  if (temperature > 25) return "Partly Cloudy";
  if (temperature > 20) return "Cloudy";
  if (temperature > 15) return "Overcast";
  return "Rainy";
}

function generateFiveDayForecast(
  location: string,
  baseTemperature: number,
): DisplayWeatherForecastToolOutput["forecast"] {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const hash = hashStringToNumber(location);

  return dayNames.map((day, index) => {
    const variance = ((hash + index * 7) % 10) - 5;
    const high = baseTemperature + variance + 3;
    const low = baseTemperature + variance - 5;
    return {
      day,
      high,
      low,
      condition: pickWeatherConditionFromTemperature(high),
    };
  });
}

function hashStringToNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const character = input.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash |= 0;
  }
  return Math.abs(hash);
}
