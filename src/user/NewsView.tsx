import { useEffect, useState } from 'react';
import { getArticles, getCategories } from '@/lib/api';
import type { Article, Category } from '@/types';

export default function NewsView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch articles using the API (Firebase Function)
        const [articlesRes, categoriesRes] = await Promise.all([
          getArticles(20), // Get 20 latest articles
          getCategories(),
        ]);

        if (articlesRes.success) {
          setArticles(articlesRes.articles);
        }

        if (categoriesRes.success) {
          setCategories(categoriesRes.categories);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Helper function to format dates
  function formatDate(timestamp: any): string {
    if (!timestamp) return '';

    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Helper function to get articles by category
  const getArticlesByCategory = (categorySlug: string, maxCount: number) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return articles.slice(0, maxCount);

    return articles
      .filter(article => article.categories.includes(category.id))
      .slice(0, maxCount);
  };

  // Get featured article (first article)
  const featuredArticle = articles[0];

  // Get articles for row 2 (next 4 articles)
  const row2Articles = articles.slice(1, 5);

  // Get sidebar articles - try to diversify by category
  const topStories = articles.slice(5, 9);
  const businessArticles = getArticlesByCategory('business', 5);
  const thisWeekArticles = articles.slice(9, 14);

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
        <h1 className="font-serif font-black text-6xl md:text-7xl uppercase leading-none mb-4">
          Tribune
        </h1>

        {/* Subhead with date only - full width lines */}
        <div className="border-t-2 border-b-2 border-[#2f2f2f] py-3">
          <div className="text-xs uppercase">
            <span className="font-semibold">New York, NY</span>
            <span className="mx-2">—</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Main Layout: Left Column (1/5) + Main Content (4/5) */}
        <div className="flex gap-6">
          {/* LEFT COLUMN - 1/5 width */}
          <div className="w-1/5 border-r-2 border-[#2f2f2f] pr-6">
            {/* Section 1: Top Stories */}
            {topStories.length > 0 && (
              <div className="mb-8 pb-6 border-b-2 border-[#2f2f2f]">
                <h3 className="uppercase mb-4 border-b border-[#2f2f2f] pb-2 text-xl tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Top Stories
                </h3>
                <div className="space-y-2">
                  {topStories.map((article, index) => (
                    <div key={article.id} className={index < topStories.length - 1 ? "border-b border-gray-400 pb-2" : "pb-2"}>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <h4 className="font-bold text-base leading-snug" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {article.title}
                        </h4>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Business & Markets */}
            {businessArticles.length > 0 && (
              <div className="mb-8 pb-6 border-b-2 border-[#2f2f2f]">
                <h3 className="uppercase mb-4 border-b border-[#2f2f2f] pb-2 text-xl tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Business & Markets
                </h3>
                <div className="space-y-2">
                  {businessArticles.map((article, index) => (
                    <div key={article.id} className={index < businessArticles.length - 1 ? "border-b border-gray-400 pb-2" : "pb-2"}>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <h4 className="font-bold text-base leading-snug" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {article.title}
                        </h4>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: This Week */}
            {thisWeekArticles.length > 0 && (
              <div>
                <h3 className="uppercase mb-4 border-b border-[#2f2f2f] pb-2 text-xl tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  This Week
                </h3>
                <div className="space-y-2">
                  {thisWeekArticles.map((article, index) => (
                    <div key={article.id} className={index < thisWeekArticles.length - 1 ? "border-b border-gray-400 pb-2" : "pb-2"}>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <h4 className="font-bold text-base leading-snug" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {article.title}
                        </h4>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MAIN CONTENT - 4/5 width */}
          <div className="w-4/5">
            {/* ROW 1: Main Article */}
            {featuredArticle && (
              <div className="mb-8 border-b-2 border-[#2f2f2f] pb-8">
                {/* Main Heading - Full Width */}
                <a href={featuredArticle.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  <h2 className="font-serif font-bold text-4xl leading-tight mb-6 text-center">
                    {featuredArticle.title}
                  </h2>
                </a>

                {/* Photo (2/3) + Summary (1/3) */}
                <div className="flex gap-6">
                  {/* Featured Photo - 2/3 width */}
                  <div className="w-2/3">
                    {featuredArticle.imageUrl ? (
                      <img
                        src={featuredArticle.imageUrl}
                        alt={featuredArticle.title}
                        className="w-full h-96 object-cover mb-3 grayscale opacity-90"
                      />
                    ) : (
                      <div className="w-full h-96 bg-gradient-to-br from-amber-100 to-amber-200 mb-3 flex items-center justify-center">
                        <span className="text-amber-400 text-sm italic">[ Image not available ]</span>
                      </div>
                    )}
                    <p className="text-xs italic">
                      {featuredArticle.sourceName} • {featuredArticle.author || 'Staff'}
                      {featuredArticle.publishedDate && (
                        <> • {formatDate(featuredArticle.publishedDate)}</>
                      )}
                    </p>
                  </div>

                  {/* Summary Text - 1/3 width */}
                  <div className="w-1/3">
                    {featuredArticle.summary && (
                      <p className="text-sm leading-relaxed mb-3">
                        {featuredArticle.summary}
                      </p>
                    )}
                    <a
                      href={featuredArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-[#2f2f2f] hover:underline"
                    >
                      Read full article →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ROW 2: Four Equal Columns */}
            {row2Articles.length > 0 && (
              <div className="grid grid-cols-4 gap-6 border-b-2 border-[#2f2f2f] pb-8 mb-8">
                {row2Articles.map((article, index) => (
                  <div key={article.id} className={index < 3 ? "border-r border-[#2f2f2f] pr-4" : ""}>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      <h3 className="font-serif font-bold text-xl text-center mb-3 pb-2 border-b border-[#2f2f2f]">
                        {article.title}
                      </h3>
                    </a>

                    {article.imageUrl && (
                      <>
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-32 object-cover mb-2 grayscale opacity-90"
                        />
                        <p className="text-xs italic mb-2">{article.sourceName}</p>
                      </>
                    )}

                    {article.summary && (
                      <p className="text-sm leading-relaxed mb-3 line-clamp-4">
                        {article.summary}
                      </p>
                    )}

                    <p className="text-xs text-gray-600">
                      {article.sourceName}
                      {article.publishedDate && (
                        <> • {formatDate(article.publishedDate)}</>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6">
          <p className="text-xs uppercase">End of Current Edition</p>
        </div>
      </div>
    </div>
  );
}
