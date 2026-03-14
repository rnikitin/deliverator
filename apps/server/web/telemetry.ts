import { ROOT_CONTEXT, SpanStatusCode, propagation, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor, WebTracerProvider } from "@opentelemetry/sdk-trace-web";

let initialized = false;

function createExporter() {
  const endpoint = import.meta.env.VITE_DELIVERATOR_OTLP_ENDPOINT;
  if (!endpoint) {
    return null;
  }

  const url = endpoint.endsWith("/v1/traces") ? endpoint : `${endpoint.replace(/\/$/, "")}/v1/traces`;
  return new OTLPTraceExporter({ url });
}

export function initBrowserTelemetry(): void {
  if (initialized || typeof window === "undefined") {
    return;
  }

  const exporter = createExporter();
  if (!exporter) {
    initialized = true;
    return;
  }

  const provider = new WebTracerProvider({
    spanProcessors: [new BatchSpanProcessor(exporter)]
  });

  provider.register();

  const tracer = trace.getTracer("deliverator-web");
  const pageLoadSpan = tracer.startSpan("page.load");
  pageLoadSpan.end();

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const span = tracer.startSpan("ui.fetch");
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    propagation.inject(trace.setSpan(ROOT_CONTEXT, span), headers);

    try {
      const response = await originalFetch(input, { ...init, headers });
      span.setAttribute("http.status_code", response.status);
      span.setStatus({ code: SpanStatusCode.OK });
      return response;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: "fetch_failed" });
      throw error;
    } finally {
      span.end();
    }
  };

  initialized = true;
}
