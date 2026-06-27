export const cockpitForwardedBuildArgSpecs = [
  {
    buildArg: "VITE_COCKPIT_GITLAB_BASE_URL",
    secretName: "COCKPIT_GITLAB_BASE_URL",
  },
  {
    buildArg: "VITE_COCKPIT_GITLAB_PROJECT",
    secretName: "COCKPIT_GITLAB_PROJECT",
  },
  {
    buildArg: "VITE_COCKPIT_MACHINES",
    secretName: "COCKPIT_MACHINES",
  },
];

function extractStaticSpaBuildStage(dockerfileText) {
  const buildStageStartIndex = dockerfileText.indexOf("AS build");
  if (buildStageStartIndex === -1) {
    return "";
  }
  const remainder = dockerfileText.slice(buildStageStartIndex);
  const nextStageIndex = remainder.indexOf("\nFROM ");
  return nextStageIndex === -1 ? remainder : remainder.slice(0, nextStageIndex);
}

function lineIndexMatching(lines, predicate) {
  return lines.findIndex((line) => predicate(line));
}

function findDockerfileForwardingGaps(buildArg, buildStageText) {
  const lines = buildStageText.split("\n");
  const productionBuildLineIndex = lineIndexMatching(lines, (line) =>
    /^\s*RUN\s+pnpm\b.*\bbuild\b/.test(line),
  );
  const declaresArgLineIndex = lineIndexMatching(lines, (line) =>
    new RegExp(`^\\s*ARG\\s+${buildArg}(\\s|=|$)`).test(line),
  );
  const exportsEnvLineIndex = lineIndexMatching(lines, (line) =>
    new RegExp(`^\\s*ENV\\s+${buildArg}=`).test(line),
  );
  const gaps = [];
  if (declaresArgLineIndex === -1) {
    gaps.push("missing-arg-declaration");
  }
  if (exportsEnvLineIndex === -1) {
    gaps.push("missing-env-export");
  } else if (
    productionBuildLineIndex !== -1 &&
    exportsEnvLineIndex > productionBuildLineIndex
  ) {
    gaps.push("env-export-after-build");
  }
  return gaps;
}

function findWorkflowForwardingGaps(spec, deployWorkflowText) {
  const gaps = [];
  const forwardsBuildArg = new RegExp(`--build-arg\\s+${spec.buildArg}=`).test(
    deployWorkflowText,
  );
  if (!forwardsBuildArg) {
    gaps.push("missing-build-arg-forwarding");
  }
  if (!deployWorkflowText.includes(`secrets.${spec.secretName}`)) {
    gaps.push("missing-secret-binding");
  }
  return gaps;
}

export function findUnforwardedCockpitBuildArgs(
  dockerfileText,
  deployWorkflowText,
  specs = cockpitForwardedBuildArgSpecs,
) {
  const buildStageText = extractStaticSpaBuildStage(dockerfileText);
  return specs
    .map((spec) => ({
      buildArg: spec.buildArg,
      gaps: [
        ...findDockerfileForwardingGaps(spec.buildArg, buildStageText),
        ...findWorkflowForwardingGaps(spec, deployWorkflowText),
      ],
    }))
    .filter((result) => result.gaps.length > 0);
}
