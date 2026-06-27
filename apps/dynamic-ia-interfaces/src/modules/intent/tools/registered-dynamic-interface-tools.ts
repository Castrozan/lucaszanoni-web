import { displayWeatherForecastTool } from "./display-weather-forecast-tool";
import { displayDataTableTool } from "./display-data-table-tool";
import { displayMetricsDashboardTool } from "./display-metrics-dashboard-tool";
import { displayDynamicFormTool } from "./display-dynamic-form-tool";

export const allRegisteredDynamicInterfaceTools = {
  displayWeatherForecast: displayWeatherForecastTool,
  displayDataTable: displayDataTableTool,
  displayMetricsDashboard: displayMetricsDashboardTool,
  displayDynamicForm: displayDynamicFormTool,
} as const;
