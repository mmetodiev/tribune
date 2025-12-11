import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { getArticlesFromLastDays } from '@/services/articlesService';
import { distributeArticlesEvenly } from '@/services/utils/serendipity';
import { subscribeToEnabledSources } from '@/services/sourcesService';
import type { Article, Source } from '@/types';

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
  const sourcesRef = useRef<Source[]>([]);
  const sourcesHashRef = useRef<string>('');

  // Create a hash of sources to detect changes
  const getSourcesHash = useCallback((sources: Source[]): string => {
    return sources
      .filter(s => s.enabled)
      .map(s => `${s.id}:${s.enabled}`)
      .sort()
      .join('|');
  }, []);

  const fetchArticles = useCallback(async (totalArticles = 60, daysBack = 3) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[ArticlesContext] Fetching articles from last', daysBack, 'days');

      // Fetch all articles from last N days
      const allArticles = await getArticlesFromLastDays(daysBack);

      console.log('[ArticlesContext] Found', allArticles.length, 'articles');

      if (allArticles.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      // Distribute evenly across sources deterministically (no randomization)
      const distributedArticles = distributeArticlesEvenly(allArticles, totalArticles);

      console.log('[ArticlesContext] Returning', distributedArticles.length, 'articles');

      setArticles(distributedArticles);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to source changes and refresh articles when sources update
  useEffect(() => {
    console.log('[ArticlesContext] Subscribing to source changes');

    const unsubscribe = subscribeToEnabledSources((sources: Source[]) => {
      const newHash = getSourcesHash(sources);
      const previousHash = sourcesHashRef.current;

      console.log('[ArticlesContext] Sources updated:', {
        previousHash,
        newHash,
        sourceCount: sources.length,
      });

      // Update sources reference
      sourcesRef.current = sources;

      // If sources changed (hash different) or this is the first load, fetch articles
      if (newHash !== previousHash) {
        sourcesHashRef.current = newHash;
        console.log('[ArticlesContext] Sources changed, refreshing articles');
        fetchArticles(60, 3);
      } else {
        console.log('[ArticlesContext] Sources unchanged, keeping cached articles');
      }
    });

    return () => {
      console.log('[ArticlesContext] Unsubscribing from source changes');
      unsubscribe();
    };
  }, [fetchArticles, getSourcesHash]);

  const clearCache = useCallback(() => {
    console.log('[ArticlesContext] Clearing cache');
    setArticles([]);
    sourcesHashRef.current = '';
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

