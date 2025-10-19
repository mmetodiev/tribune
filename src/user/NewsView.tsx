import { useSerendipityArticles } from '@/hooks/useSerendipityArticles';

export default function NewsView() {
  // Fetch 60 articles (last 3 days, evenly distributed, randomized)
  // Filter for HackerNews in left column + other sources in main content
  const { articles, loading } = useSerendipityArticles({ 
    totalArticles: 60,
    daysBack: 3 
  });

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

  // Right main content: Other articles
  const mainContent = otherArticles.slice(0, 20);
  const row1Articles = mainContent.slice(0, 6);   // 3 cols × 2 articles
  const row2Articles = mainContent.slice(6, 12);  // 3 cols × 2 articles (changed from 4×1)
  const row3Articles = mainContent.slice(12, 20); // 2 cols × 4 articles

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
                    <div key={article.id} className={index < leftColumnArticles.length - 1 ? "border-b border-gray-400 pb-2" : "pb-2"}>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <h4 className="font-bold text-sm leading-snug" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {article.title}
                        </h4>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MAIN CONTENT - 4/5 width on desktop */}
          <div className="w-full lg:w-4/5">
            {/* ROW 1: 3 columns × 2 articles each = 6 total */}
            {row1Articles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 border-b-2 border-[#2f2f2f] pb-8 mb-8">
                {[0, 1, 2].map((colIndex) => {
                  const colArticles = row1Articles.slice(colIndex * 2, colIndex * 2 + 2);
                  if (colArticles.length === 0) return null;

                  return (
                    <div key={colIndex} className={colIndex < 2 ? "lg:border-r border-[#2f2f2f] lg:pr-4" : ""}>
                      {colArticles.map((article, index) => (
                        <div key={article.id} className={index === 0 ? "mb-6" : ""}>
                          <div className="mb-2 pb-2 border-b border-[#2f2f2f]">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              <h3 className="font-bold text-lg inline" style={{ fontFamily: 'Lato, sans-serif' }}>
                                {article.title}
                              </h3>
                            </a>
                            <span className="text-xs text-gray-600"> · {article.sourceName}</span>
                          </div>

                          {article.imageUrl && (
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-32 object-cover mb-2 grayscale opacity-90"
                            />
                          )}

                          {/* Show RSS summary first, fall back to extractedSummary */}
                          {(article.summary || article.extractedSummary) && (
                            <p className="text-sm leading-relaxed mb-2 line-clamp-3">
                              {article.summary || article.extractedSummary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ROW 2: 3 columns × 2 articles each = 6 total */}
            {row2Articles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 border-b-2 border-[#2f2f2f] pb-8 mb-8">
                {[0, 1, 2].map((colIndex) => {
                  const colArticles = row2Articles.slice(colIndex * 2, colIndex * 2 + 2);
                  if (colArticles.length === 0) return null;

                  return (
                    <div key={colIndex} className={colIndex < 2 ? "lg:border-r border-[#2f2f2f] lg:pr-4" : ""}>
                      {colArticles.map((article, index) => (
                        <div key={article.id} className={index === 0 ? "mb-6" : ""}>
                          <div className="mb-2 pb-2 border-b border-[#2f2f2f]">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              <h3 className="font-bold text-lg inline" style={{ fontFamily: 'Lato, sans-serif' }}>
                                {article.title}
                              </h3>
                            </a>
                            <span className="text-xs text-gray-600"> · {article.sourceName}</span>
                          </div>

                          {article.imageUrl && (
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-32 object-cover mb-2 grayscale opacity-90"
                            />
                          )}

                          {/* Show RSS summary first, fall back to extractedSummary */}
                          {(article.summary || article.extractedSummary) && (
                            <p className="text-sm leading-relaxed mb-2 line-clamp-3">
                              {article.summary || article.extractedSummary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ROW 3: 2 columns × 4 articles each = 8 total */}
            {row3Articles.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[0, 1].map((colIndex) => {
                  const colArticles = row3Articles.slice(colIndex * 4, colIndex * 4 + 4);
                  if (colArticles.length === 0) return null;

                  return (
                    <div key={colIndex} className={colIndex === 0 ? "lg:border-r border-[#2f2f2f] lg:pr-6" : ""}>
                      {colArticles.map((article, index) => (
                        <div key={article.id} className={index < colArticles.length - 1 ? "border-b border-gray-400 pb-4 mb-4" : "pb-4"}>
                          <div className="mb-2">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              <h4 className="font-bold text-base inline" style={{ fontFamily: 'Lato, sans-serif' }}>
                                {article.title}
                              </h4>
                            </a>
                            <span className="text-xs text-gray-600"> · {article.sourceName}</span>
                          </div>

                          {/* Show RSS summary first, fall back to extractedSummary */}
                          {(article.summary || article.extractedSummary) && (
                            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                              {article.summary || article.extractedSummary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
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
