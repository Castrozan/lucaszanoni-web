function stringAttribute(key, value) {
  return { key, value: { stringValue: value } };
}

function intAttribute(key, value) {
  return { key, value: { intValue: String(value) } };
}

function observationAttributes(observation) {
  return [
    stringAttribute("app.id", observation.id),
    stringAttribute("app.mount_path", observation.mountPath),
    intAttribute("http.response.status_code", observation.observedStatus),
  ];
}

function upGauge(observations, timeUnixNano) {
  return {
    name: "synthetic_uptime_up",
    description:
      "1 when the live edge served an allowed status for the app route, 0 otherwise",
    unit: "1",
    gauge: {
      dataPoints: observations.map((observation) => ({
        timeUnixNano,
        asInt: observation.up ? "1" : "0",
        attributes: observationAttributes(observation),
      })),
    },
  };
}

function probeDurationGauge(observations, timeUnixNano) {
  return {
    name: "synthetic_uptime_probe_duration_milliseconds",
    description:
      "Wall-clock duration of the edge probe request for the app route",
    unit: "ms",
    gauge: {
      dataPoints: observations.map((observation) => ({
        timeUnixNano,
        asDouble: observation.probeDurationMilliseconds,
        attributes: observationAttributes(observation),
      })),
    },
  };
}

export function buildOtlpUptimeMetricsPayload({
  serviceName,
  observations,
  timeUnixNano,
}) {
  return {
    resourceMetrics: [
      {
        resource: {
          attributes: [stringAttribute("service.name", serviceName)],
        },
        scopeMetrics: [
          {
            scope: { name: serviceName },
            metrics: [
              upGauge(observations, timeUnixNano),
              probeDurationGauge(observations, timeUnixNano),
            ],
          },
        ],
      },
    ],
  };
}
