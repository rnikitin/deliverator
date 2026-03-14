import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

export interface AppMetrics {
  registry: Registry;
  requestDuration: Histogram<"method" | "route" | "status_code">;
  requestCounter: Counter<"method" | "route" | "status_code">;
}

export function createMetrics(): AppMetrics {
  const registry = new Registry();

  collectDefaultMetrics({ register: registry });

  const requestDuration = new Histogram({
    name: "deliverator_http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry]
  });

  const requestCounter = new Counter({
    name: "deliverator_http_requests_total",
    help: "Count of HTTP requests",
    labelNames: ["method", "route", "status_code"],
    registers: [registry]
  });

  return { registry, requestDuration, requestCounter };
}
