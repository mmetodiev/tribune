import { useState, useEffect, useCallback } from 'react';
import { 
  getArticles as fetchArticles,
  getArticlesBySource,
  subscribeToArticles,
  subscribeToSourceArticles 
} from '@/services/articlesService';
import type { Article } from '@/types';

interface UseArticlesResult {
  articles: Article[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseArticlesOptions {
  limit?: number;
  realtime?: boolean;
}

/**
 * Hook for fetching all articles
 * 
 * @param options - Configuration options
 * @param options.limit - Maximum number of articles to fetch (default: 50)
 * @param options.realtime - Enable real-time updates (default: false)
 * @returns Object with articles, loading state, error, and refetch function
 * 
 * @example
 * const { articles, loading, error, refetch } = useArticles({ limit: 100 });
 */
export function useArticles(options: UseArticlesOptions = {}): UseArticlesResult {
  const { limit = 50, realtime = false } = options;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchArticles(limit);
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (realtime) {
      // Use real-time subscription
      setLoading(true);
      setError(null);

      const unsubscribe = subscribeToArticles(
        (data) => {
          setArticles(data);
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

  return { articles, loading, error, refetch: fetchData };
}

interface UseSourceArticlesOptions {
  limit?: number;
  realtime?: boolean;
}

/**
 * Hook for fetching articles from a specific source
 * 
 * @param sourceId - The source ID to filter by
 * @param options - Configuration options
 * @param options.limit - Maximum number of articles to fetch (default: 50)
 * @param options.realtime - Enable real-time updates (default: false)
 * @returns Object with articles, loading state, error, and refetch function
 * 
 * @example
 * const { articles, loading } = useSourceArticles('source-123', { limit: 20 });
 */
export function useSourceArticles(
  sourceId: string,
  options: UseSourceArticlesOptions = {}
): UseArticlesResult {
  const { limit = 50, realtime = false } = options;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getArticlesBySource(sourceId, limit);
      setArticles(data);
    } catch (err) {
      console.error('Error fetching source articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch source articles');
    } finally {
      setLoading(false);
    }
  }, [sourceId, limit]);

  useEffect(() => {
    if (!sourceId) {
      setArticles([]);
      setLoading(false);
      return;
    }

    if (realtime) {
      // Use real-time subscription
      setLoading(true);
      setError(null);

      const unsubscribe = subscribeToSourceArticles(
        sourceId,
        (data) => {
          setArticles(data);
          setLoading(false);
        },
        limit
      );

      return () => unsubscribe();
    } else {
      // One-time fetch
      fetchData();
    }
  }, [sourceId, limit, realtime, fetchData]);

  return { articles, loading, error, refetch: fetchData };
}

