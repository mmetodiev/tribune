import { useState, useEffect } from "react";
import {
  getSources,
  getCategories,
  getArticles,
  getFetchLogs,
  manualFetchAll,
} from "@/lib/api";
import type { Source, Category, Article, FetchLog } from "@/types";

export default function Dashboard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetchLogs, setFetchLogs] = useState<FetchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);

    try {
      const [sourcesRes, categoriesRes, articlesRes, logsRes] =
        await Promise.all([
          getSources(),
          getCategories(),
          getArticles(100),
          getFetchLogs(10),
        ]);

      if (sourcesRes.success) setSources(sourcesRes.sources);
      if (categoriesRes.success) setCategories(categoriesRes.categories);
      if (articlesRes.success) setArticles(articlesRes.articles);
      if (logsRes.success) setFetchLogs(logsRes.logs);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualFetch() {
    setFetching(true);
    setError(null);

    try {
      const result = await manualFetchAll();
      console.log("Manual fetch result:", result);

      // Reload data to show new articles and logs
      await loadDashboardData();

      alert(
        `Fetch completed!\nArticles fetched: ${result.totalArticles}\nErrors: ${result.errorCount}`
      );
    } catch (err) {
      console.error("Manual fetch failed:", err);
      setError("Manual fetch failed");
    } finally {
      setFetching(false);
    }
  }

  function toggleLogDetails(logId: string) {
    setExpandedLog(expandedLog === logId ? null : logId);
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return "N/A";

    // Handle Firestore Timestamp
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getArticlesLast24h(): number {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    return articles.filter((article) => {
      if (!article.fetchedAt) return false;

      let fetchDate: Date;
      if (
        article.fetchedAt.toDate &&
        typeof article.fetchedAt.toDate === "function"
      ) {
        fetchDate = article.fetchedAt.toDate();
      } else if ((article.fetchedAt as any).seconds) {
        fetchDate = new Date((article.fetchedAt as any).seconds * 1000);
      } else {
        fetchDate = new Date(article.fetchedAt);
      }

      return fetchDate > yesterday;
    }).length;
  }

  function getLastFetchTime(): string {
    if (fetchLogs.length === 0) return "Never";
    return formatDate(fetchLogs[0].timestamp);
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const activeSources = sources.filter((s) => s.enabled).length;
  const articlesLast24h = getArticlesLast24h();

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleManualFetch}
          disabled={fetching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {fetching ? "Fetching..." : "Fetch All Sources Now"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Sources
          </h3>
          <p className="text-3xl font-bold text-gray-900">{sources.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {activeSources} active / {sources.length - activeSources} disabled
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Articles
          </h3>
          <p className="text-3xl font-bold text-gray-900">{articles.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {articlesLast24h} in last 24h
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Categories
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {categories.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Last Fetch
          </h3>
          <p className="text-lg font-semibold text-gray-900">
            {getLastFetchTime()}
          </p>
          {fetchLogs.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {fetchLogs[0].articlesAdded} articles,{" "}
              {fetchLogs[0].errors} errors
            </p>
          )}
        </div>
      </div>

      {/* Fetch Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Recent Fetch Logs</h2>
        </div>

        <div className="p-6">
          {fetchLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                No fetch logs yet. Click "Fetch All Sources Now" to start.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fetchLogs.map((log) => {
                const successRate =
                  log.sourcesProcessed > 0
                    ? ((log.sourcesProcessed - log.errors) /
                        log.sourcesProcessed) *
                      100
                    : 0;
                const statusColor =
                  log.errors === 0
                    ? "bg-green-100 text-green-800 border-green-200"
                    : log.errors === log.sourcesProcessed
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200";

                return (
                  <div
                    key={log.id}
                    className={`border rounded-lg overflow-hidden ${statusColor}`}
                  >
                    {/* Summary */}
                    <div
                      className="p-4 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleLogDetails(log.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">
                              {formatDate(log.timestamp)}
                            </span>
                            <span className="text-sm">
                              {log.articlesAdded} articles from{" "}
                              {log.sourcesProcessed} sources
                            </span>
                            {log.errors > 0 && (
                              <span className="text-sm font-medium">
                                {log.errors} error{log.errors > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            <div className="w-48 bg-white/50 rounded-full h-2">
                              <div
                                className="bg-current h-2 rounded-full transition-all"
                                style={{ width: `${successRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <svg
                          className={`w-5 h-5 transition-transform ${
                            expandedLog === log.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Details */}
                    {expandedLog === log.id && (
                      <div className="border-t border-current/20 bg-white/30 p-4">
                        <h4 className="font-semibold mb-2">Source Details:</h4>
                        <div className="space-y-2">
                          {log.details.map((detail, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                {detail.success ? (
                                  <span className="text-green-600">✓</span>
                                ) : (
                                  <span className="text-red-600">✗</span>
                                )}
                                <span className="font-medium">
                                  {detail.sourceName}
                                </span>
                              </div>
                              <div className="text-right">
                                {detail.success ? (
                                  <span className="text-gray-700">
                                    {detail.articleCount} article
                                    {detail.articleCount !== 1 ? "s" : ""}
                                  </span>
                                ) : (
                                  <span className="text-red-700">
                                    {detail.error}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {sources.length === 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Get Started</h3>
          <p className="text-blue-800 mb-4">
            You haven't added any sources yet. Let's get started!
          </p>
          <div className="space-y-2">
            <a
              href="/admin/sources"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Source
            </a>
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Create Categories
          </h3>
          <p className="text-blue-800 mb-4">
            Categories help organize your articles automatically.
          </p>
          <a
            href="/admin/categories"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Category
          </a>
        </div>
      )}
    </div>
  );
}
