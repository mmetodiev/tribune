import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { getArticleById, saveExtractedContent } from "@/services/articlesService";
import { extractArticle } from "@/services/articleExtractorService";
import { isRSSSummaryStub } from "@/utils/articleUtils";
import type { Article } from "@/types";

export default function ArticleReader() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [displayContent, setDisplayContent] = useState<string | null>(null);
  const extractingRef = useRef<string | null>(null); // Track which URL is being extracted

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

      // Check if we have cached full content
      if (articleData.fullContent) {
        setDisplayContent(articleData.fullContent);
      } else {
        // Display RSS content initially
        setDisplayContent(null); // null means use RSS summary
        
        // Only auto-fetch if RSS summary is a stub (too short)
        const isStub = isRSSSummaryStub(articleData.summary || "");
        if (isStub) {
          // Auto-fetch for stub articles
          extractArticleContent(articleData);
        }
        // For articles with sufficient RSS content, user can manually fetch
      }

    } catch (err) {
      console.error("Error loading article:", err);
      setError(err instanceof Error ? err.message : "Failed to load article");
    } finally {
      setLoading(false);
    }
  }

  async function extractArticleContent(articleData: Article) {
    if (!articleData.url) return;

    // Prevent duplicate extractions of the same URL
    if (extractingRef.current === articleData.url) {
      console.log("Extraction already in progress for this URL");
      return;
    }

    try {
      extractingRef.current = articleData.url;
      setExtracting(true);
      
      const result = await extractArticle(articleData.url);

      if (result.success && result.content) {
        // Save to cache
        if (articleId) {
          try {
            await saveExtractedContent(articleId, result.content);
          } catch (cacheError) {
            console.warn("Failed to cache extracted content:", cacheError);
            // Continue anyway - we still have the content
          }
        }

        // Update display content
        setDisplayContent(result.content);
        
        // Update article state with cached content
        setArticle({
          ...articleData,
          fullContent: result.content,
        });
      } else {
        // Extraction failed - silently fall back to RSS content
        console.warn("Article extraction failed:", result.error);
        // Keep RSS content displayed
      }
    } catch (err) {
      console.error("Error extracting article:", err);
      // Silently fall back to RSS content
    } finally {
      setExtracting(false);
      extractingRef.current = null;
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

  // Determine which content to display
  // If displayContent is null, use RSS summary; if it has a value, use extracted content
  const contentToDisplay = displayContent !== null ? displayContent : (article.summary || "");
  
  // Sanitize the content HTML
  const sanitizedContent = contentToDisplay
    ? DOMPurify.sanitize(contentToDisplay, {
        ALLOWED_TAGS: [
          // Text formatting
          'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
          // Headings
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          // Lists
          'ul', 'ol', 'li',
          // Links and media
          'a', 'img', 'figure', 'figcaption',
          // Quotes and code
          'blockquote', 'q', 'code', 'pre',
          // Structural
          'div', 'span', 'article', 'section',
          // Tables
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          // Other
          'hr', 'del', 'ins', 'abbr', 'time'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'width', 'height', 
          'class', 'id', 'datetime', 'cite', 'target', 'rel'
        ],
        // Allow target="_blank" for links
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
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
        {/* Title with Manual Fetch Button */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl md:text-4xl font-bold font-serif leading-tight text-gray-900 flex-1">
            {article.title}
          </h1>
          
          {/* Manual Fetch Button - Only show if:
              1. No full content is displayed (not cached)
              2. Not currently extracting
              3. RSS summary exists and is NOT a stub (has sufficient content)
          */}
          {displayContent === null && !extracting && article.summary && !isRSSSummaryStub(article.summary) && (
            <button
              onClick={() => extractArticleContent(article)}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors whitespace-nowrap"
              title="Fetch full article content from source"
            >
              <span className="hidden sm:inline">Fetch Full Article</span>
              <span className="sm:hidden">Fetch</span>
            </button>
          )}
          
          {/* Loading indicator for manual fetch (when RSS content is sufficient) */}
          {extracting && article.summary && !isRSSSummaryStub(article.summary) && (
            <div className="flex-shrink-0 px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="hidden sm:inline">Fetching...</span>
            </div>
          )}
        </div>

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

        {/* Loading indicator for background extraction (only for stub articles) */}
        {extracting && article.summary && isRSSSummaryStub(article.summary) && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>Enhancing article content...</span>
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none 
          prose-p:font-serif prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-5 
          prose-headings:font-serif prose-headings:font-bold prose-headings:text-gray-900
          prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
          prose-strong:text-gray-900 prose-strong:font-semibold 
          prose-em:text-gray-800 prose-em:italic
          prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700
          prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-gray-800
          prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded prose-pre:overflow-x-auto
          prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
          prose-ul:list-disc prose-ul:ml-6 prose-ol:list-decimal prose-ol:ml-6
          prose-li:text-gray-800 prose-li:mb-2
          prose-table:border-collapse prose-table:w-full prose-th:border prose-th:p-2 prose-th:bg-gray-100 prose-td:border prose-td:p-2
          prose-hr:border-gray-300 prose-hr:my-8
        ">
          {sanitizedContent ? (
            <div 
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              className="transition-opacity duration-300"
            />
          ) : (
            <p className="text-gray-600 italic">No content available. Please visit the original article to read the full content.</p>
          )}
        </div>

        {/* Call to Action - Only show if we're displaying RSS content */}
        {!displayContent && !extracting && (
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
        )}

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

