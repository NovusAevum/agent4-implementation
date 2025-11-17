import { useHealth } from '../hooks/useHealth';
import { Activity, TrendingUp, Clock, Server } from 'lucide-react';

export function HealthMonitor() {
  const { health, loading, error } = useHealth(5000);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-32 bg-white/5 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <Activity className="w-5 h-5" />
          <span>Failed to load health status: {error}</span>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const statusColor = {
    healthy: 'status-healthy',
    degraded: 'status-degraded',
    unhealthy: 'status-unhealthy',
  }[health.status] || 'status-degraded';

  const statusDot = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
  }[health.status] || 'bg-yellow-500';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Header - Mobile Responsive */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">System Health</h3>
              <p className="text-xs sm:text-sm text-gray-400">Real-time monitoring</p>
            </div>
          </div>
          <div className={`status-badge ${statusColor}`}>
            <div className={`w-2 h-2 rounded-full ${statusDot} animate-pulse-slow`}></div>
            <span className="capitalize">{health.status}</span>
          </div>
        </div>

        {/* Stats Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Uptime"
            value={health.uptime}
            color="text-blue-400"
          />
          <StatCard
            icon={<Server className="w-5 h-5" />}
            label="Environment"
            value={health.environment}
            color="text-purple-400"
          />
          {health.health.memory && (
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Memory Usage"
              value={`${health.health.memory.heapUsedPercent.toFixed(1)}%`}
              color={health.health.memory.heapUsedPercent > 90 ? 'text-red-400' : 'text-green-400'}
            />
          )}
          {health.health.cache && (
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              label="Cache Hit Rate"
              value={`${(health.health.cache.hitRate * 100).toFixed(1)}%`}
              color="text-cyan-400"
            />
          )}
        </div>

        {/* Timestamp - Mobile Responsive */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs sm:text-sm text-gray-500">
            Last updated: {new Date(health.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="glass p-4 rounded-lg hover:bg-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`${color} mt-1`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-lg sm:text-xl font-semibold truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}
