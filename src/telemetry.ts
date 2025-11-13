/**
 * OpenTelemetry Instrumentation
 * Provides distributed tracing and metrics for observability
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { logger } from './utils';

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 * Only initializes if enabled via environment variable
 */
export function initTelemetry(): void {
  // Skip if telemetry is disabled
  if (process.env.OTEL_ENABLED !== 'true') {
    logger.info('OpenTelemetry disabled (set OTEL_ENABLED=true to enable)');
    return;
  }

  try {
    // Prometheus exporter for metrics (optional)
    const prometheusExporter = new PrometheusExporter({
      port: parseInt(process.env.OTEL_METRICS_PORT || '9464', 10),
    });

    // OTLP trace exporter (for Jaeger, Zipkin, etc.)
    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    });

    sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME || 'agent4-implementation',
      traceExporter,
      metricReader: prometheusExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Configure auto-instrumentations
          '@opentelemetry/instrumentation-fs': {
            enabled: false, // Disable file system instrumentation (too verbose)
          },
          '@opentelemetry/instrumentation-http': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
        }),
      ],
    });

    sdk.start();

    logger.info('OpenTelemetry initialized', {
      serviceName: process.env.OTEL_SERVICE_NAME || 'agent4-implementation',
      traceEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      metricsPort: process.env.OTEL_METRICS_PORT || '9464',
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk?.shutdown();
        logger.info('OpenTelemetry shut down successfully');
      } catch (error) {
        logger.error('Error shutting down OpenTelemetry', error as Error);
      }
    });
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry', error as Error);
  }
}

/**
 * Shutdown OpenTelemetry (for testing)
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
    logger.info('OpenTelemetry shutdown complete');
  }
}
