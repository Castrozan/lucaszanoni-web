import test from "node:test";
import assert from "node:assert/strict";
import { buildOtlpUptimeMetricsPayload } from "../../synthetic-uptime/otlp-uptime-metrics.mjs";

const sampleObservations = [
  {
    id: "shell",
    mountPath: "/",
    observedStatus: 200,
    up: true,
    probeDurationMilliseconds: 42.5,
  },
  {
    id: "reports",
    mountPath: "/engineering/dotfiles/reports/",
    observedStatus: 503,
    up: false,
    probeDurationMilliseconds: 1200,
  },
];

function buildSamplePayload() {
  return buildOtlpUptimeMetricsPayload({
    serviceName: "lucaszanoni-synthetic-uptime",
    observations: sampleObservations,
    timeUnixNano: "1718000000000000000",
  });
}

function findMetric(payload, metricName) {
  const scopeMetrics = payload.resourceMetrics[0].scopeMetrics[0];
  return scopeMetrics.metrics.find((metric) => metric.name === metricName);
}

function attributeValue(attributes, key) {
  return attributes.find((attribute) => attribute.key === key)?.value;
}

test("stamps the service name as a resource attribute", () => {
  const payload = buildSamplePayload();
  const resourceAttributes = payload.resourceMetrics[0].resource.attributes;
  assert.deepEqual(attributeValue(resourceAttributes, "service.name"), {
    stringValue: "lucaszanoni-synthetic-uptime",
  });
});

test("emits the up gauge as an int datapoint per observation", () => {
  const upGauge = findMetric(buildSamplePayload(), "synthetic_uptime_up");
  const points = upGauge.gauge.dataPoints;
  assert.equal(points.length, 2);
  assert.equal(points[0].asInt, "1");
  assert.equal(points[0].timeUnixNano, "1718000000000000000");
  assert.equal(points[1].asInt, "0");
  assert.deepEqual(attributeValue(points[0].attributes, "app.id"), {
    stringValue: "shell",
  });
  assert.deepEqual(attributeValue(points[1].attributes, "app.mount_path"), {
    stringValue: "/engineering/dotfiles/reports/",
  });
  assert.deepEqual(
    attributeValue(points[1].attributes, "http.response.status_code"),
    { intValue: "503" },
  );
});

test("emits the probe duration gauge as a double datapoint per observation", () => {
  const durationGauge = findMetric(
    buildSamplePayload(),
    "synthetic_uptime_probe_duration_milliseconds",
  );
  const points = durationGauge.gauge.dataPoints;
  assert.equal(points.length, 2);
  assert.equal(points[0].asDouble, 42.5);
  assert.equal(points[1].asDouble, 1200);
  assert.equal(durationGauge.unit, "ms");
});

test("encodes every int64 field as a string and never carries trace or log signals", () => {
  const payload = buildSamplePayload();
  assert.equal(
    typeof payload.resourceMetrics[0].scopeMetrics[0].metrics[0].gauge
      .dataPoints[0].asInt,
    "string",
  );
  assert.ok(!("resourceSpans" in payload));
  assert.ok(!("resourceLogs" in payload));
});
