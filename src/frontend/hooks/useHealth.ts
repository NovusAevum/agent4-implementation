import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { HealthStatus } from '../types';

export function useHealth(intervalMs: number = 5000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchHealth = async () => {
      try {
        const data = await api.getHealth();
        if (mounted) {
          setHealth(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch health');
          setLoading(false);
        }
      }
    };

    fetchHealth();
    const intervalId = setInterval(fetchHealth, intervalMs);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return { health, loading, error };
}
