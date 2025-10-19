import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getArticlesFromLastDays } from '@/services/articlesService';
import { distributeArticlesEvenly } from '@/services/utils/serendipity';
import type { Article } from '@/types';

interface ArticlesContextType {
  articles: Article[];
  loading: boolean;
  error: string | null;
  fetchArticles: (totalArticles?: number, daysBack?: number) => Promise<void>;
  clearCache: () => void;
}

const ArticlesContext = createContext<ArticlesContextType | undefined>(undefined);

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  const fetchArticles = useCallback(async (totalArticles = 60, daysBack = 3) => {
    // If we already have articles and haven't explicitly called clearCache, return cached
    if (articles.length > 0 && hasInitialFetch) {
      console.log('[ArticlesContext] Using cached articles:', articles.length);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[ArticlesContext] Fetching articles from last', daysBack, 'days');

      // Step 1: Fetch all articles from last N days
      const allArticles = await getArticlesFromLastDays(daysBack);

      console.log('[ArticlesContext] Found', allArticles.length, 'articles');

      if (allArticles.length === 0) {
        setArticles([]);
        setLoading(false);
        setHasInitialFetch(true);
        return;
      }

      // Step 2: Distribute evenly across sources and randomize
      const distributedArticles = distributeArticlesEvenly(allArticles, totalArticles);

      console.log('[ArticlesContext] Returning', distributedArticles.length, 'articles');

      setArticles(distributedArticles);
      setHasInitialFetch(true);
    } catch (err) {
      console.error('Error fetching serendipity articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch serendipity articles');
    } finally {
      setLoading(false);
    }
  }, [articles.length, hasInitialFetch]);

  const clearCache = useCallback(() => {
    console.log('[ArticlesContext] Clearing cache');
    setArticles([]);
    setHasInitialFetch(false);
    setError(null);
  }, []);

  return (
    <ArticlesContext.Provider value={{ articles, loading, error, fetchArticles, clearCache }}>
      {children}
    </ArticlesContext.Provider>
  );
}

export function useArticlesContext() {
  const context = useContext(ArticlesContext);
  if (context === undefined) {
    throw new Error('useArticlesContext must be used within an ArticlesProvider');
  }
  return context;
}

