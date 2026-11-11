import assert from "node:assert/strict";
import { test } from "node:test";
import registerGenerator from "../../../turbo/generators/config.ts";
import { addAppPrompts } from "../../../turbo/generators/add-app/prompts.ts";

function generatorDefinition() {
  let definition;
  registerGenerator({
    setActionType() {},
    setGenerator(name, value) {
      assert.equal(name, "add-app");
      definition = value;
    },
  });
  return definition;
}

test("new app generation defaults to the free static Worker workflow", () => {
  assert.equal(
    addAppPrompts.find((prompt) => prompt.name === "originKind").default,
    "cloudflare-worker",
  );
  assert.deepEqual(
    addAppPrompts.find((prompt) => prompt.name === "buildProfile").choices,
    ["static-spa"],
  );
  for (const originKind of ["cloudflare-worker", "cloud-run"]) {
    const actions = generatorDefinition().actions({
      originKind,
      buildProfile: "static-spa",
    });
    assert.ok(actions.some((action) => action.type === "appendRegistryEntry"));
    assert.ok(actions.some((action) => action.type === "addMany"));
  }
});

test("unsupported dynamic templates fail before any registry mutation", () => {
  assert.throws(
    () =>
      generatorDefinition().actions({
        originKind: "cloudflare-worker",
        buildProfile: "dynamic-service",
      }),
    /scaffolds static SPAs/,
  );
});
