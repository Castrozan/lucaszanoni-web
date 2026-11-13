export function assertPrivateApplicationAccess(
  applications,
  accessApplications,
  siteHostname,
) {
  for (const application of applications) {
    if (application.accessModel.environment === "public") continue;
    if (
      !siteHostname ||
      new URL(`https://${siteHostname}`).hostname !== siteHostname
    ) {
      throw new Error(
        "CLOUDFLARE_SITE_HOSTNAME must identify the private application's Access perimeter",
      );
    }
    const path =
      application.accessApplicationProvisioning?.kind ===
      "inherited-from-parent-path"
        ? application.accessApplicationProvisioning.parentMountPath
        : application.mountPath;
    const expectedDomain = `${siteHostname}${path === "/" ? "" : path.slice(0, -1)}`;
    const gate = accessApplications.find(
      (candidate) =>
        candidate.domain === expectedDomain && candidate.type === "self_hosted",
    );
    if (
      !gate ||
      !gate.policies?.some((policy) => policy.decision === "allow") ||
      gate.policies.some((policy) => policy.decision === "bypass")
    ) {
      throw new Error(
        `Application ${application.applicationId} requires an existing non-bypass Access application at ${expectedDomain}`,
      );
    }
    const applicationDomain = `${siteHostname}${application.mountPath === "/" ? "" : application.mountPath.slice(0, -1)}`;
    if (
      accessApplications.some(
        (candidate) =>
          candidate.domain.length >= expectedDomain.length &&
          (candidate.domain === applicationDomain ||
            applicationDomain.startsWith(`${candidate.domain}/`)) &&
          candidate.policies?.some((policy) => policy.decision === "bypass"),
      )
    ) {
      throw new Error(
        `Application ${application.applicationId} would inherit an Access bypass`,
      );
    }
  }
}
