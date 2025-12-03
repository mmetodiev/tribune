import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { getArticleById } from "@/services/articlesService";
import type { Article } from "@/types";

export default function ArticleReader() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  async function loadArticle() {
    try {
      setLoading(true);
      setError("");

      if (!articleId) {
        setError("No article ID provided");
        return;
      }

      const articleData = await getArticleById(articleId);
      if (!articleData) {
        setError("Article not found");
        return;
      }
      setArticle(articleData);

    } catch (err) {
      console.error("Error loading article:", err);
      setError(err instanceof Error ? err.message : "Failed to load article");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4 font-serif">Loading article...</div>
          <div className="text-sm text-gray-600">Fetching article details</div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">📰</div>
          <div className="text-2xl mb-4 text-red-600 font-serif">{error || "Article not found"}</div>
          <p className="text-gray-600 mb-6">
            {article ? (
              <>
                You can view the full article at the source website.
              </>
            ) : (
              "The article could not be found."
            )}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition-colors"
            >
              ← Go Back
            </button>
            {article && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Original
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Sanitize the summary HTML if it exists
  const sanitizedSummary = article.summary 
    ? DOMPurify.sanitize(article.summary, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'a'],
        ALLOWED_ATTR: ['href']
      })
    : "";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b sticky top-0 bg-white z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back</span>
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span className="hidden sm:inline">View Full Article →</span>
            <span className="sm:hidden">View Full →</span>
          </a>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-3 font-serif leading-tight text-gray-900">
          {article.title}
        </h1>

        {/* Metadata */}
        <div className="text-gray-600 mb-8 pb-6 border-b border-gray-200 space-y-1">
          {article.author && (
            <div className="text-sm font-medium text-gray-700">{article.author}</div>
          )}
          <div className="text-xs flex flex-wrap gap-2 items-center text-gray-500">
            <span className="font-medium">Source:</span>
            <span>{article.sourceName}</span>
            {article.publishedDate && (
              <>
                <span>•</span>
                <span>{new Date(article.publishedDate.seconds * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </>
            )}
          </div>
        </div>

        {/* Article Image */}
        {article.imageUrl && (
          <div className="mb-8">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* RSS Summary Content */}
        <div className="prose prose-lg max-w-none prose-p:font-serif prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-5 prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:transition-colors prose-strong:text-gray-900 prose-strong:font-semibold prose-em:text-gray-800 prose-em:italic">
          {sanitizedSummary ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizedSummary }} />
          ) : (
            <p className="text-gray-600 italic">No summary available. Please visit the original article to read the full content.</p>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-center text-gray-700 mb-4 font-medium">
            This is a preview from the RSS feed.
          </p>
          <div className="text-center">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Read Full Article at {article.sourceName}
              <span>→</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">· · ·</p>
            <p className="text-xs text-gray-500">
              Article sourced from {article.sourceName}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

