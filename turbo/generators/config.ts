import type { PlopTypes } from "@turbo/gen";
import { registerAppendRegistryEntryAction } from "./add-app/registry-append-action.ts";
import { addAppPrompts } from "./add-app/prompts.ts";
import type { AddAppAnswers } from "@platform/config";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  registerAppendRegistryEntryAction(plop);

  plop.setGenerator("add-app", {
    description:
      "Register a new platform app in the single-source app registry and scaffold its in-repo micro-frontend",
    prompts: addAppPrompts,
    actions: (data) => {
      const answers = data as AddAppAnswers;
      const actions: PlopTypes.ActionType[] = [{ type: "appendRegistryEntry" }];
      if (answers.originKind === "in-repo-cloud-run") {
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
