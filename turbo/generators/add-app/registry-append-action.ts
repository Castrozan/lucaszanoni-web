import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PlopTypes } from "@turbo/gen";
import { buildAppRegistryEntry } from "../../../packages/config/src/app-registry-entry-builder.ts";
import {
  resolveAccessModel,
  resolveOriginSpec,
  type AddAppAnswers,
} from "../../../packages/config/src/app-registry-answers-resolver.ts";
import { appendEntryToRegistryDocument } from "../../../packages/config/src/app-registry-document-writer.ts";

const registryRelativePath = "packages/config/src/app-registry.json";

export function appendRegistryEntryFromAnswers(
  registryAbsolutePath: string,
  answers: AddAppAnswers,
): string {
  const entry = buildAppRegistryEntry({
    id: answers.id,
    mountPath: answers.mountPath,
    navigationLabel: answers.navigationLabel,
    description: answers.description,
    showInCrossSectionNavigation: answers.showInCrossSectionNavigation,
    status: answers.status,
    accessModel: resolveAccessModel(answers),
    origin: resolveOriginSpec(answers),
  });
  const nextRegistryJson = appendEntryToRegistryDocument(
    readFileSync(registryAbsolutePath, "utf8"),
    entry,
  );
  writeFileSync(registryAbsolutePath, nextRegistryJson);
  return `appended ${answers.id} to the app registry`;
}

export function registerAppendRegistryEntryAction(
  plop: PlopTypes.NodePlopAPI,
): void {
  plop.setActionType("appendRegistryEntry", (rawAnswers, _config, plopApi) => {
    const answers = rawAnswers as unknown as AddAppAnswers;
    const registryAbsolutePath = join(
      plopApi.getDestBasePath(),
      registryRelativePath,
    );
    return appendRegistryEntryFromAnswers(registryAbsolutePath, answers);
  });
}
