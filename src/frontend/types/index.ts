export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  uptime: string;
  health: {
    status: string;
    uptime: number;
    memory?: {
      heapUsedPercent: number;
    };
    cache?: {
      hitRate: number;
    };
  };
}

export interface ApiInfo {
  name: string;
  version: string;
  status: string;
  endpoints: {
    health: string;
    metrics: string;
    execute: string;
  };
  documentation: string;
}

export interface MetricsData {
  success: boolean;
  metrics?: any;
}

export interface ExecuteRequest {
  task: string;
  provider?: string;
  options?: Record<string, any>;
}

export interface ExecuteResponse {
  success: boolean;
  result?: string;
  provider?: string;
  error?: string;
  details?: any;
  requestId?: string;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: string;
  error?: boolean;
}
