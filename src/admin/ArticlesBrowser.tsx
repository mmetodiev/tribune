import { useState } from "react";
import { useArticles } from "@/hooks/useArticles";
import { useSources } from "@/hooks/useSources";

export default function ArticlesBrowser() {
  // Use hooks for data fetching
  const { articles, loading: articlesLoading, error: articlesError } = useArticles({ limit: 500 });
  const { sources, loading: sourcesLoading } = useSources();
  
  const loading = articlesLoading || sourcesLoading;
  const error = articlesError;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  function formatDate(timestamp: any): string {
    if (!timestamp) return "No date";

    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.sourceName.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Source filter
    if (selectedSource !== "all" && article.sourceId !== selectedSource) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Articles Browser</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Articles Browser</h1>
        <div className="text-sm text-gray-600">
          Showing {filteredArticles.length} of {articles.length} articles
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || selectedSource !== "all") && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSource("all");
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📰</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No articles yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add sources and fetch articles to see them here.
          </p>
          <a
            href="/admin/sources"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Sources Manager
          </a>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No articles match your filters
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredArticles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                {/* Article Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {article.title}
                    </a>
                  </div>
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>

                {/* Summary */}
                {article.summary && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {article.summary}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {/* Source */}
                  <span className="text-gray-600">
                    <span className="font-medium text-gray-900">
                      {article.sourceName}
                    </span>
                  </span>

                  {/* Date */}
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    {formatDate(article.publishedDate || article.fetchedAt)}
                  </span>

                  {/* Author */}
                  {article.author && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{article.author}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Read Article →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
