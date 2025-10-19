import { useState, useEffect, useCallback } from 'react';
import { 
  getSources as fetchSources,
  getEnabledSources,
  subscribeToSources,
  subscribeToEnabledSources 
} from '@/services/sourcesService';
import type { Source } from '@/types';

interface UseSourcesResult {
  sources: Source[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseSourcesOptions {
  enabledOnly?: boolean;
  realtime?: boolean;
}

/**
 * Hook for fetching sources
 * 
 * @param options - Configuration options
 * @param options.enabledOnly - Only fetch enabled sources (default: false)
 * @param options.realtime - Enable real-time updates (default: false)
 * @returns Object with sources, loading state, error, and refetch function
 * 
 * @example
 * const { sources, loading, error, refetch } = useSources({ enabledOnly: true });
 */
export function useSources(options: UseSourcesOptions = {}): UseSourcesResult {
  const { enabledOnly = false, realtime = false } = options;
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = enabledOnly ? await getEnabledSources() : await fetchSources();
      setSources(data);
    } catch (err) {
      console.error('Error fetching sources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  }, [enabledOnly]);

  useEffect(() => {
    if (realtime) {
      // Use real-time subscription
      setLoading(true);
      setError(null);

      const unsubscribe = enabledOnly
        ? subscribeToEnabledSources((data) => {
            setSources(data);
            setLoading(false);
          })
        : subscribeToSources((data) => {
            setSources(data);
            setLoading(false);
          });

      return () => unsubscribe();
    } else {
      // One-time fetch
      fetchData();
    }
  }, [enabledOnly, realtime, fetchData]);

  return { sources, loading, error, refetch: fetchData };
}

