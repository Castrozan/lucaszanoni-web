import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { readEdgeProductionConfiguration } from "../../edge-router/edge-production-configuration.mjs";

test("production flags must be the literal strings true or false", () => {
  const enabled = {
    ENABLE_DOTCOM_CANONICAL: "true",
    ENABLE_KIRA_SESSION_TUNNEL: "true",
    ENABLE_RIN_SESSION_TUNNEL: "false",
  };
  assert.deepEqual(readEdgeProductionConfiguration(enabled), {
    servingDomain: "lucaszanoni.com",
    aliasRedirect: { canonicalHost: "lucaszanoni.com", statusCode: 301 },
    cockpitSessionTunnels: { kira: true, rin: false },
  });
  fc.assert(
    fc.property(
      fc.constantFrom(...Object.keys(enabled)),
      fc.option(
        fc.string().filter((value) => !["true", "false"].includes(value)),
      ),
      (flagName, invalidValue) => {
        const environment = {
          ...enabled,
          [flagName]: invalidValue ?? undefined,
        };
        assert.throws(
          () => readEdgeProductionConfiguration(environment),
          new RegExp(`${flagName} must be true or false`),
        );
      },
    ),
  );
});
