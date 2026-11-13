import { readFileSync, writeFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import standaloneCode from "ajv/dist/standalone/index.js";
import { qualityOverviewPayloadSchema } from "../src/topics/quality-overview/quality-overview-schema.ts";

const argumentsList = process.argv.slice(2);
if (argumentsList.some((argument) => argument !== "--check")) {
  throw new Error(
    "Only --check is accepted; omit it to regenerate the validator",
  );
}
const validator = new Ajv({ allErrors: true, code: { source: true } });
addFormats(validator);
const generatedCode = standaloneCode(
  validator,
  validator.compile(qualityOverviewPayloadSchema),
);
const destination = new URL(
  "../src/topics/quality-overview/generated/quality-overview-validator.cjs",
  import.meta.url,
);
if (argumentsList.includes("--check")) {
  if (readFileSync(destination, "utf8") !== generatedCode) {
    throw new Error(
      "Quality overview validator is stale; run pnpm --filter @platform/ingestion-contracts generate:quality-overview-validator",
    );
  }
  console.log("Quality overview standalone validator matches its schema");
} else {
  writeFileSync(destination, generatedCode);
  console.log("Generated quality overview standalone validator");
}
