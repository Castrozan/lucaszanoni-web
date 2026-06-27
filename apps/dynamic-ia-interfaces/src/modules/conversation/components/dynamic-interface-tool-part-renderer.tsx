import { WeatherForecastCard } from "./weather-forecast-card";
import { DataTableDisplay } from "./data-table-display";
import { MetricsDashboardDisplay } from "./metrics-dashboard-display";
import { DynamicFormDisplay } from "./dynamic-form-display";
import { ToolPartLoadingSkeleton } from "./tool-part-loading-skeleton";
import { ToolPartErrorDisplay } from "./tool-part-error-display";

interface ToolPartRendererProps {
  readonly toolName: string;
  readonly state: "input-available" | "output-available" | "output-error";
  readonly output?: Record<string, unknown>;
  readonly errorText?: string;
}

const toolNameToOutputComponentMap: Record<
  string,
  React.ComponentType<Record<string, unknown>>
> = {
  displayWeatherForecast: WeatherForecastCard as React.ComponentType<Record<string, unknown>>,
  displayDataTable: DataTableDisplay as React.ComponentType<Record<string, unknown>>,
  displayMetricsDashboard: MetricsDashboardDisplay as React.ComponentType<Record<string, unknown>>,
  displayDynamicForm: DynamicFormDisplay as React.ComponentType<Record<string, unknown>>,
};

export function DynamicInterfaceToolPartRenderer({
  toolName,
  state,
  output,
  errorText,
}: ToolPartRendererProps) {
  if (state === "input-available") {
    return <ToolPartLoadingSkeleton toolName={toolName} />;
  }

  if (state === "output-error") {
    return (
      <ToolPartErrorDisplay
        toolName={toolName}
        errorText={errorText ?? "An unknown error occurred"}
      />
    );
  }

  const OutputComponent = toolNameToOutputComponentMap[toolName];

  if (!OutputComponent || !output) {
    return (
      <ToolPartErrorDisplay
        toolName={toolName}
        errorText={`No renderer registered for tool: ${toolName}`}
      />
    );
  }

  return <OutputComponent {...output} />;
}
