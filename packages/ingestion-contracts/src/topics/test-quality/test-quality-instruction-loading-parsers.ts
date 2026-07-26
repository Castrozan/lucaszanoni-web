import { requireBoolean } from "../../field-parsers/boolean-field-parsers";
import {
  requireFiniteNumber,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireUnitInterval,
} from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireNonEmptyArray,
} from "../../field-parsers/record-shape-field-parsers";
import {
  requireTimestamp,
  requireString,
  requireUrlSafeLabel,
} from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import type {
  TestQualityInstructionLoadingCategory,
  TestQualityInstructionLoadingExperiment,
} from "./test-quality-types";

const MAXIMUM_RATE_ROUNDING_DRIFT = 0.0005;
const MAXIMUM_DELTA_ROUNDING_DRIFT = 0.001;

function assertDeltaMatchesTheRatesItSitsBetween(
  category: TestQualityInstructionLoadingCategory,
  context: string,
): void {
  const measuredDelta =
    category.passRateWithInstructions - category.passRateWithoutInstructions;
  if (Math.abs(category.delta - measuredDelta) > MAXIMUM_DELTA_ROUNDING_DRIFT) {
    throw new IngestionContractViolationError(
      `${context} reports ${category.category} with a delta of ${category.delta} that its own two pass rates do not produce`,
    );
  }
}

function assertDiscordantPairsFitThePairedSet(
  category: TestQualityInstructionLoadingCategory,
  context: string,
): void {
  const discordantPairs =
    category.instructionsOnlyWins + category.controlOnlyWins;
  if (discordantPairs > category.pairedTests) {
    throw new IngestionContractViolationError(
      `${context} reports ${discordantPairs} discordant pairs for ${category.category} across only ${category.pairedTests} paired tests`,
    );
  }
}

function assertRateResolvesToWholeTests(
  category: TestQualityInstructionLoadingCategory,
  rateFieldName: string,
  rate: number,
  context: string,
): void {
  const passedTests = rate * category.pairedTests;
  const tolerance = category.pairedTests * MAXIMUM_RATE_ROUNDING_DRIFT;
  if (Math.abs(passedTests - Math.round(passedTests)) > tolerance) {
    throw new IngestionContractViolationError(
      `${context} reports ${category.category} with a ${rateFieldName} of ${rate} that no whole number of tests out of ${category.pairedTests} could produce`,
    );
  }
}

function assertSignificanceMatchesTheAlphaItWasTakenAgainst(
  category: TestQualityInstructionLoadingCategory,
  significanceAlpha: number,
  context: string,
): void {
  if (category.significant !== category.exactPValue <= significanceAlpha) {
    throw new IngestionContractViolationError(
      `${context} reports ${category.category} as significant=${category.significant} against a p-value of ${category.exactPValue} and an alpha of ${significanceAlpha}`,
    );
  }
}

function parseInstructionLoadingCategory(
  value: unknown,
  context: string,
): TestQualityInstructionLoadingCategory {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(
    record,
    [
      "category",
      "pairedTests",
      "passRateWithInstructions",
      "passRateWithoutInstructions",
      "delta",
      "instructionsOnlyWins",
      "controlOnlyWins",
      "exactPValue",
      "significant",
    ],
    context,
  );

  const category: TestQualityInstructionLoadingCategory = {
    category: requireUrlSafeLabel(record, "category", context),
    pairedTests: requirePositiveInteger(record, "pairedTests", context),
    passRateWithInstructions: requireUnitInterval(
      record,
      "passRateWithInstructions",
      context,
    ),
    passRateWithoutInstructions: requireUnitInterval(
      record,
      "passRateWithoutInstructions",
      context,
    ),
    delta: requireFiniteNumber(record, "delta", context),
    instructionsOnlyWins: requireNonNegativeInteger(
      record,
      "instructionsOnlyWins",
      context,
    ),
    controlOnlyWins: requireNonNegativeInteger(
      record,
      "controlOnlyWins",
      context,
    ),
    exactPValue: requireUnitInterval(record, "exactPValue", context),
    significant: requireBoolean(record, "significant", context),
  };

  assertDeltaMatchesTheRatesItSitsBetween(category, context);
  assertDiscordantPairsFitThePairedSet(category, context);
  assertRateResolvesToWholeTests(
    category,
    "passRateWithInstructions",
    category.passRateWithInstructions,
    context,
  );
  assertRateResolvesToWholeTests(
    category,
    "passRateWithoutInstructions",
    category.passRateWithoutInstructions,
    context,
  );
  return category;
}

function assertCategoriesAreDistinct(
  categories: readonly TestQualityInstructionLoadingCategory[],
  context: string,
): void {
  const seen = new Set<string>();
  for (const { category } of categories) {
    if (seen.has(category)) {
      throw new IngestionContractViolationError(
        `${context} reports the category ${category} more than once`,
      );
    }
    seen.add(category);
  }
}

export function parseInstructionLoadingExperiment(
  value: unknown,
  context: string,
): TestQualityInstructionLoadingExperiment {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(
    record,
    ["recordedAt", "recordedCommit", "significanceAlpha", "categories"],
    context,
  );

  const significanceAlpha = requireUnitInterval(
    record,
    "significanceAlpha",
    context,
  );
  const categories = requireNonEmptyArray(record, "categories", context).map(
    (declaredCategory) =>
      parseInstructionLoadingCategory(declaredCategory, context),
  );
  assertCategoriesAreDistinct(categories, context);
  for (const category of categories) {
    assertSignificanceMatchesTheAlphaItWasTakenAgainst(
      category,
      significanceAlpha,
      context,
    );
  }

  return {
    recordedAt: requireTimestamp(record, "recordedAt", context),
    recordedCommit: requireString(record, "recordedCommit", context),
    significanceAlpha,
    categories,
  };
}
