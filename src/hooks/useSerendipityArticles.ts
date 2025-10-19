import { useState, useEffect, useCallback } from 'react';
import { getArticlesFromLastDays } from '@/services/articlesService';
import { distributeArticlesEvenly } from '@/services/utils/serendipity';
import type { Article } from '@/types';

interface UseSerendipityArticlesResult {
  articles: Article[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseSerendipityArticlesOptions {
  totalArticles?: number;
  daysBack?: number;
}

/**
 * Hook for fetching serendipity articles
 * 
 * Fetches articles from the last N days and distributes them evenly across sources
 * with randomization for a serendipitous reading experience.
 * 
 * @param options - Configuration options
 * @param options.totalArticles - Total number of articles to return (default: 20)
 * @param options.daysBack - Number of days to look back (default: 3)
 * @returns Object with articles, loading state, error, and refetch function
 * 
 * @example
 * const { articles, loading, error } = useSerendipityArticles({ totalArticles: 40 });
 */
export function useSerendipityArticles(
  options: UseSerendipityArticlesOptions = {}
): UseSerendipityArticlesResult {
  const { totalArticles = 20, daysBack = 3 } = options;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useSerendipityArticles] Fetching articles from last', daysBack, 'days');

      // Step 1: Fetch all articles from last N days
      const allArticles = await getArticlesFromLastDays(daysBack);

      console.log('[useSerendipityArticles] Found', allArticles.length, 'articles');

      if (allArticles.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      // Step 2: Distribute evenly across sources and randomize
      const distributedArticles = distributeArticlesEvenly(allArticles, totalArticles);

      console.log('[useSerendipityArticles] Returning', distributedArticles.length, 'articles');

      setArticles(distributedArticles);
    } catch (err) {
      console.error('Error fetching serendipity articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch serendipity articles');
    } finally {
      setLoading(false);
    }
  }, [totalArticles, daysBack]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { articles, loading, error, refetch: fetchData };
}

