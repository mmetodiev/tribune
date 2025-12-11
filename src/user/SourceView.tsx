import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowDownRight } from 'lucide-react';
import { getArticlesBySource } from '@/services/articlesService';
import SourcesSidebar from './components/SourcesSidebar';
import { getPreviewText } from '@/lib/htmlUtils';
import type { Article } from '@/types';

export default function SourceView() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);

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
  
  const getDateValue = (timestamp: any): number => {
    if (!timestamp) return 0;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().getTime();
    } else if (timestamp.seconds) {
      return timestamp.seconds * 1000;
    } else {
      return new Date(timestamp).getTime();
    }
  };

  // Sort articles by publishedDate (newest first), fallback to fetchedAt if no publishedDate
  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = a.publishedDate || a.fetchedAt;
    const dateB = b.publishedDate || b.fetchedAt;
    return getDateValue(dateB) - getDateValue(dateA); // Descending order (newest first)
  });
  
  const displayedArticles = sortedArticles.slice(0, visibleCount);
  const hasMore = sortedArticles.length > visibleCount;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

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
          <div className="w-full lg:w-1/4 lg:pr-6">
            <SourcesSidebar />
          </div>

          {/* MAIN CONTENT - 4/5 width on desktop */}
          <div className="w-full lg:w-3/4">
            {/* Back button */}
            <div className="mb-6">
              <Link 
                to="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                ← Back to all articles
              </Link>
            </div>

            {/* Source title */}
            <h2 className="font-serif font-semibold text-3xl sm:text-4xl mb-8">
              {sourceName}
            </h2>

            {/* Articles list - single column */}
            <div className="space-y-6">
              {displayedArticles.map((article, index) => {
                const handleClick = (e: React.MouseEvent) => {
                  // Allow opening original with Cmd/Ctrl+Click
                  if (e.metaKey || e.ctrlKey) {
                    e.preventDefault();
                    window.open(article.url, '_blank');
                  }
                };

                const publishedDate = formatDate(article.publishedDate);

                return (
                  <div key={article.id}>
                    <div className="flex items-start gap-3">
                      {/* External link icon */}
                      <ArrowDownRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      
                      {/* Title and description */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link 
                            to={`/article/${article.id}`}
                            className="hover:underline"
                            onClick={handleClick}
                          >
                            <h3 className="font-semibold text-lg" style={{ fontFamily: 'Lato, sans-serif' }}>
                              {article.title}
                            </h3>
                          </Link>
                          {publishedDate && (
                            <span className="text-xs text-gray-500">
                              {publishedDate}
                            </span>
                          )}
                        </div>
                        
                        {/* Description */}
                        {article.summary && (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {getPreviewText(article.summary, 300)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Separator line - light grey */}
                    {index < displayedArticles.length - 1 && (
                      <div className="mt-6 border-b border-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Load More button */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + 30)}
                  className="px-6 py-2 bg-[#2f2f2f] text-[#f9f7f1] hover:bg-[#1a1a1a] transition-colors font-semibold text-sm uppercase"
                >
                  Load More
                </button>
              </div>
            )}

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

