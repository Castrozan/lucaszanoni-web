import type { ValidateFunction } from "ajv";
import type { QualityOverviewPayload } from "../quality-overview-types";

declare const validateQualityOverview: ValidateFunction<QualityOverviewPayload>;
export = validateQualityOverview;
