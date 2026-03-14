import type { AppConfig } from "@deliverator/contracts";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";

let sdk: NodeSDK | undefined;

function resolveTracesEndpoint(otlpEndpoint: string): string {
  if (!otlpEndpoint) {
    return "";
  }

  return otlpEndpoint.endsWith("/v1/traces") ? otlpEndpoint : `${otlpEndpoint.replace(/\/$/, "")}/v1/traces`;
}

export async function bootstrapTelemetry(config: AppConfig): Promise<void> {
  if (sdk || !config.telemetry.otlpEndpoint) {
    return;
  }

  sdk = new NodeSDK({
    serviceName: config.telemetry.serviceName,
    traceExporter: new OTLPTraceExporter({
      url: resolveTracesEndpoint(config.telemetry.otlpEndpoint)
    }),
    instrumentations: [getNodeAutoInstrumentations()]
  });

  await sdk.start();
}

export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = undefined;
}
