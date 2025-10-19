import { useState, useEffect, useCallback } from 'react';
import { 
  getFetchLogs as fetchLogs,
  subscribeToFetchLogs 
} from '@/services/fetchLogsService';
import type { FetchLog } from '@/types';

interface UseFetchLogsResult {
  logs: FetchLog[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseFetchLogsOptions {
  limit?: number;
  realtime?: boolean;
}

/**
 * Hook for fetching fetch logs
 * 
 * @param options - Configuration options
 * @param options.limit - Maximum number of logs to fetch (default: 10)
 * @param options.realtime - Enable real-time updates (default: false)
 * @returns Object with logs, loading state, error, and refetch function
 * 
 * @example
 * const { logs, loading, error, refetch } = useFetchLogs({ limit: 20, realtime: true });
 */
export function useFetchLogs(options: UseFetchLogsOptions = {}): UseFetchLogsResult {
  const { limit = 10, realtime = false } = options;
  const [logs, setLogs] = useState<FetchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLogs(limit);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching fetch logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (realtime) {
      // Use real-time subscription
      setLoading(true);
      setError(null);

      const unsubscribe = subscribeToFetchLogs(
        (data) => {
          setLogs(data);
          setLoading(false);
        },
        limit
      );

      return () => unsubscribe();
    } else {
      // One-time fetch
      fetchData();
    }
  }, [limit, realtime, fetchData]);

  return { logs, loading, error, refetch: fetchData };
}

