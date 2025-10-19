import { useEffect } from 'react';
import { useArticlesContext } from '@/contexts/ArticlesContext';
import ArticleItem from './components/ArticleItem';
import HeadlineItem from './components/HeadlineItem';

export default function NewsView() {
  // Use cached articles from context to preserve state across navigation
  const { articles, loading, fetchArticles } = useArticlesContext();

  // Fetch articles on mount (will use cache if available)
  useEffect(() => {
    fetchArticles(60, 3);
  }, [fetchArticles]);

  // Helper function to format dates - removed as most articles don't have dates
  // function formatDate(timestamp: any): string {
  //   if (!timestamp) return '';
  //   let date: Date;
  //   if (timestamp.toDate && typeof timestamp.toDate === 'function') {
  //     date = timestamp.toDate();
  //   } else if (timestamp.seconds) {
  //     date = new Date(timestamp.seconds * 1000);
  //   } else {
  //     date = new Date(timestamp);
  //   }
  //   return date.toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //   });
  // }

  // Article distribution
  // Filter HackerNews articles for left column
  const hackerNewsArticles = articles.filter(article => 
    article.sourceName.toLowerCase().includes('hacker') || 
    article.sourceName.toLowerCase().includes('hn')
  );
  
  // Other articles for main content
  const otherArticles = articles.filter(article => 
    !article.sourceName.toLowerCase().includes('hacker') && 
    !article.sourceName.toLowerCase().includes('hn')
  );

  // Left sidebar: Up to 20 HackerNews headlines
  const leftColumnArticles = hackerNewsArticles.slice(0, 20);

  // Right main content: Other articles with new distribution
  const mainContent = otherArticles.slice(0, 28);
  const row1Articles = mainContent.slice(0, 9);    // 9 articles in 3 columns
  const row2Articles = mainContent.slice(9, 18);   // 9 articles in 3 columns
  const row3Articles = mainContent.slice(18, 28);  // 10 articles in 2 columns

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f7f1] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-serif mb-4">Loading...</div>
          <div className="text-sm text-gray-600">Fetching latest articles</div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9f7f1] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-serif mb-4">No Articles Yet</div>
          <div className="text-sm text-gray-600">Please add sources and fetch articles from the admin panel</div>
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

        {/* Subhead with date only - full width lines */}
        <div className="border-t-2 border-b-2 border-[#2f2f2f] py-2 sm:py-3">
          <div className="text-xs sm:text-sm uppercase px-2">
            <span className="font-semibold">New York, NY</span>
            <span className="mx-1 sm:mx-2">—</span>
            <span className="text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Main Layout: Left Column (1/5) + Main Content (4/5) */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN - 1/5 width on desktop, full width on mobile */}
          <div className="w-full lg:w-1/5 lg:border-r-2 border-[#2f2f2f] lg:pr-6">
            {/* HackerNews Headlines */}
            {leftColumnArticles.length > 0 && (
              <div>
                <h3 className="uppercase mb-4 border-b border-[#2f2f2f] pb-2 text-xl tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  HackerNews
                </h3>
                <div className="space-y-2">
                  {leftColumnArticles.map((article, index) => (
                    <HeadlineItem
                      key={article.id}
                      article={article}
                      showBorder={index < leftColumnArticles.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MAIN CONTENT - 4/5 width on desktop */}
          <div className="w-full lg:w-4/5">
            {/* ROW 1: 9 articles flowing in 3 columns */}
            {row1Articles.length > 0 && (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-rule:1px_solid_theme(colors.gray.300)] border-b-2 border-[#2f2f2f] pb-8 mb-8">
                {row1Articles.map((article) => (
                  <ArticleItem key={article.id} article={article} variant="large" />
                ))}
              </div>
            )}

            {/* ROW 2: 9 articles flowing in 3 columns */}
            {row2Articles.length > 0 && (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-rule:1px_solid_theme(colors.gray.300)] border-b-2 border-[#2f2f2f] pb-8 mb-8">
                {row2Articles.map((article) => (
                  <ArticleItem key={article.id} article={article} variant="large" />
                ))}
              </div>
            )}

            {/* ROW 3: 10 articles flowing in 2 columns */}
            {row3Articles.length > 0 && (
              <div className="columns-1 lg:columns-2 gap-6 [column-rule:1px_solid_theme(colors.gray.300)]">
                {row3Articles.map((article) => (
                  <ArticleItem key={article.id} article={article} variant="small" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 mt-8 border-t-2 border-[#2f2f2f]">
          <p className="text-xs uppercase">End of Current Edition</p>
        </div>
      </div>
    </div>
  );
}
