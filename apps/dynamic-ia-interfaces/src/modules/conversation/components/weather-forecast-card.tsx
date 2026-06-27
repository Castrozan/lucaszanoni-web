import type { DisplayWeatherForecastToolOutput } from "@/intent/tools/display-weather-forecast-tool";

const weatherConditionIcons: Record<string, string> = {
  Sunny: "sun",
  "Partly Cloudy": "cloud-sun",
  Cloudy: "cloud",
  Overcast: "cloud",
  Rainy: "cloud-rain",
};

export function WeatherForecastCard({
  location,
  temperature,
  feelsLike,
  condition,
  humidity,
  windSpeed,
  windDirection,
  forecast,
}: DisplayWeatherForecastToolOutput) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-muted/30">
      <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">{location}</h3>
            <p className="text-muted-foreground text-sm">{condition}</p>
          </div>
          <span className="text-4xl font-light text-foreground">
            {temperature}°C
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Feels like {feelsLike}°C
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <WeatherDetailItem label="Humidity" value={`${humidity}%`} />
        <WeatherDetailItem
          label="Wind"
          value={`${windSpeed} km/h ${windDirection}`}
        />
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex justify-between gap-2">
          {forecast.map((day) => (
            <ForecastDayColumn
              key={day.day}
              day={day.day}
              high={day.high}
              low={day.low}
              condition={day.condition}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WeatherDetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function ForecastDayColumn({
  day,
  high,
  low,
  condition,
}: {
  day: string;
  high: number;
  low: number;
  condition: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-muted-foreground text-xs">{day}</span>
      <span className="text-xs">{condition === "Sunny" ? "☀️" : condition === "Rainy" ? "🌧️" : "☁️"}</span>
      <span className="text-xs font-medium text-foreground">{high}°</span>
      <span className="text-muted-foreground text-xs">{low}°</span>
    </div>
  );
}
