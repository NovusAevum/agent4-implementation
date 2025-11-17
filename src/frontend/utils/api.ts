import type { HealthStatus, ApiInfo, MetricsData, ExecuteRequest, ExecuteResponse } from '../types';

const BASE_URL = ''; // Same origin

export const api = {
  async getInfo(): Promise<ApiInfo> {
    const response = await fetch(`${BASE_URL}/`);
    if (!response.ok) throw new Error('Failed to fetch API info');
    return response.json();
  },

  async getHealth(): Promise<HealthStatus> {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) throw new Error('Failed to fetch health status');
    return response.json();
  },

  async getMetrics(): Promise<MetricsData> {
    const response = await fetch(`${BASE_URL}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  },

  async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    const response = await fetch(`${BASE_URL}/api/agent4/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  },
};
