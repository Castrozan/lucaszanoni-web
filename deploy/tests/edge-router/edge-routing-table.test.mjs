import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { createEdgeProductionConfiguration } from "../../edge-router/edge-production-configuration.mjs";
import { createEdgeRoutingTable } from "../../edge-router/edge-routing-table.mjs";

const pathSegment = fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/);

const externalOrigin = fc.record({
  kind: fc.constant("external-https"),
  originHost: fc.domain(),
  pathRewrite: fc.constantFrom("preserve", "strip-mount-path"),
  forwardedBasePath: fc.constantFrom("", "/", "/api/"),
  trusted: fc.boolean(),
});

const workerOrigin = pathSegment.map((name) => ({
  kind: "cloudflare-worker",
  scriptName: `lucaszanoni-${name}`,
}));

const registry = fc
  .uniqueArray(
    fc.record({
      segment: pathSegment,
      status: fc.constantFrom("active", "retired"),
      origin: fc.oneof(externalOrigin, workerOrigin),
      servesOnSubdomain: fc.boolean(),
    }),
    { maxLength: 12, selector: (entry) => entry.segment },
  )
  .map((entries) =>
    entries.map(({ segment, status, origin, servesOnSubdomain }) => ({
      id: segment,
      mountPath: `/${segment}/`,
      status,
      origin:
        servesOnSubdomain && origin.kind !== "external-https"
          ? { ...origin, kind: "external-https", originHost: "x.example" }
          : origin,
      ...(servesOnSubdomain
        ? { servingLocation: { kind: "subdomain", subdomainLabel: segment } }
        : {}),
    })),
  );

const productionConfiguration = fc
  .record({
    dotcomCanonical: fc.boolean(),
    kiraSessionTunnel: fc.boolean(),
    rinSessionTunnel: fc.boolean(),
  })
  .map(createEdgeProductionConfiguration);

const routingTableFor = (applications, configuration) =>
  createEdgeRoutingTable({
    registry: applications,
    workerServiceRoutes: [],
    configuration,
  });

const isSorted = (values) =>
  values.every((value, index) => index === 0 || values[index - 1] < value);

function everyObjectHasSortedKeys(value) {
  if (Array.isArray(value)) return value.every(everyObjectHasSortedKeys);
  if (value === null || typeof value !== "object") return true;
  return (
    isSorted(Object.keys(value)) &&
    Object.values(value).every(everyObjectHasSortedKeys)
  );
}

test("external origins follow the registry, overridden by cockpit session tunnels, ordered by prefix", () => {
  fc.assert(
    fc.property(
      registry,
      productionConfiguration,
      (applications, configuration) => {
        const routes = routingTableFor(
          applications,
          configuration,
        ).externalHttpsPrefixes;
        const prefixes = routes.map((route) => route.prefix);
        assert.ok(isSorted(prefixes));
        const sessionPrefixes = [
          "/cockpit/lifecycle",
          ...(configuration.cockpitSessionTunnels.kira
            ? ["/cockpit/kira-session/"]
            : []),
          ...(configuration.cockpitSessionTunnels.rin
            ? ["/cockpit/rin-session/"]
            : []),
        ];
        const registryPrefixes = applications
          .filter(
            (application) =>
              application.origin.kind === "external-https" &&
              application.servingLocation?.kind !== "subdomain",
          )
          .map((application) => application.mountPath);
        assert.deepEqual(
          [...prefixes].sort(),
          [...new Set([...registryPrefixes, ...sessionPrefixes])].sort(),
        );
        for (const application of applications) {
          const route = routes.find(
            (candidate) => candidate.prefix === application.mountPath,
          );
          if (!route) continue;
          assert.equal(route.originHost, application.origin.originHost);
          assert.equal(route.trusted, application.origin.trusted);
        }
        for (const route of routes.filter((candidate) =>
          sessionPrefixes.includes(candidate.prefix),
        )) {
          assert.equal(route.trusted, false);
          assert.ok(
            route.originHost.endsWith(
              `-session-origin.${configuration.servingDomain}`,
            ),
          );
        }
      },
    ),
  );
});

test("retired, subdomain and alias sections follow the registry and production flags", () => {
  fc.assert(
    fc.property(
      registry,
      productionConfiguration,
      (applications, configuration) => {
        const table = routingTableFor(applications, configuration);
        assert.deepEqual(
          table.retiredPrefixes,
          applications
            .filter((application) => application.status === "retired")
            .map((application) => ({ prefix: application.mountPath })),
        );
        const subdomainApplications = applications.filter(
          (application) => application.servingLocation?.kind === "subdomain",
        );
        assert.deepEqual(
          [...table.subdomains].map((route) => route.host).sort(),
          subdomainApplications
            .map(
              (application) =>
                `${application.servingLocation.subdomainLabel}.${configuration.servingDomain}`,
            )
            .sort(),
        );
        assert.ok(
          isSorted(
            table.subdomains.map((route) =>
              route.host.slice(0, -configuration.servingDomain.length - 1),
            ),
          ),
        );
        assert.deepEqual(
          table.aliasRedirect,
          configuration.servingDomain === "lucaszanoni.com"
            ? { canonicalHost: "lucaszanoni.com", statusCode: 301 }
            : null,
        );
      },
    ),
  );
});

test("every serialized object orders its keys like Terraform jsonencode so live bytes stay stable", () => {
  fc.assert(
    fc.property(
      registry,
      productionConfiguration,
      (applications, configuration) => {
        const table = createEdgeRoutingTable({
          registry: applications,
          workerServiceRoutes: [{ prefix: "/", binding: "APP_SHELL" }],
          configuration,
        });
        const { workerServicePrefixes, ...terraformDerivedSections } = table;
        assert.ok(everyObjectHasSortedKeys(terraformDerivedSections));
        assert.ok(isSorted(Object.keys(table)));
        assert.deepEqual(workerServicePrefixes, [
          { prefix: "/", binding: "APP_SHELL" },
        ]);
      },
    ),
  );
});
