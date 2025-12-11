import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticlesBySource } from '@/services/articlesService';
import ArticleItem from './components/ArticleItem';
import SourcesSidebar from './components/SourcesSidebar';
import type { Article } from '@/types';

export default function SourceView() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSourceArticles() {
      if (!sourceId) {
        setError('No source specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedArticles = await getArticlesBySource(sourceId, 100);
        setArticles(fetchedArticles);
      } catch (err) {
        console.error('Error fetching source articles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch articles');
      } finally {
        setLoading(false);
      }
    }

    fetchSourceArticles();
  }, [sourceId]);

  const sourceName = articles.length > 0 ? articles[0].sourceName : 'Source';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f7f1] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-serif mb-4">Loading...</div>
          <div className="text-sm text-gray-600">Fetching articles from source</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f9f7f1] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-serif mb-4">Error</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9f7f1] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-serif mb-4">No Articles</div>
          <div className="text-sm text-gray-600 mb-4">No articles found from this source</div>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f1] text-[#2f2f2f] py-8">
      {/* Masthead */}
      <div className="text-center mb-6">
        <h1 className="font-serif font-black text-5xl sm:text-6xl md:text-7xl uppercase leading-none mb-4">
          Tribune
        </h1>

        {/* Subhead with source name */}
        <div className="border-t-2 border-b-2 border-[#2f2f2f] py-2 sm:py-3">
          <div className="text-xs sm:text-sm uppercase px-2">
            <span className="font-semibold">Articles from {sourceName}</span>
            <span className="mx-1 sm:mx-2">—</span>
            <span className="text-xs">{articles.length} article{articles.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Main Layout: Left Column (Sources) + Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN - 1/5 width on desktop, full width on mobile */}
          <div className="w-full lg:w-1/5 lg:border-r-2 border-[#2f2f2f] lg:pr-6">
            <SourcesSidebar />
          </div>

          {/* MAIN CONTENT - 4/5 width on desktop */}
          <div className="w-full lg:w-4/5">
            {/* Back button */}
            <div className="mb-6">
              <Link 
                to="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                ← Back to all articles
              </Link>
            </div>

            {/* Articles grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-rule:1px_solid_theme(colors.gray.300)]">
              {articles.map((article) => (
                <ArticleItem key={article.id} article={article} variant="large" />
              ))}
            </div>

            {/* Footer */}
            <div className="text-center pt-6 mt-8 border-t-2 border-[#2f2f2f]">
              <p className="text-xs uppercase">End of {sourceName} Articles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

