import type { PlopTypes } from "@turbo/gen";
import { registerAppendRegistryEntryAction } from "./add-app/registry-append-action.ts";
import { addAppPrompts } from "./add-app/prompts.ts";
import type { AddAppAnswers } from "@platform/config";
import { resolveSourceSpec } from "../../packages/config/src/app-registry/answers-resolver.ts";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  registerAppendRegistryEntryAction(plop);

  plop.setGenerator("add-app", {
    description:
      "Register a new platform app in the single-source app registry and scaffold its in-repo micro-frontend",
    prompts: addAppPrompts,
    actions: (data) => {
      const answers = data as AddAppAnswers;
      const source = resolveSourceSpec(answers);
      if (source?.buildProfile === "dynamic-service") {
        throw new Error(
          "The app generator scaffolds static SPAs; dynamic services require an application-specific source adapter",
        );
      }
      const actions: PlopTypes.ActionType[] = [{ type: "appendRegistryEntry" }];
      if (source) {
        actions.push({
          type: "addMany",
          destination: "apps/{{dashCase id}}",
          base: "templates/in-repo-app",
          templateFiles: "templates/in-repo-app/**/*.hbs",
        });
      }
      return actions;
    },
  });
}
