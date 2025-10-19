import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { getArticleById } from "@/services/articlesService";
import type { Article } from "@/types";
import { AlignLeft, Columns2, Columns3, Type } from "lucide-react";

interface ParsedArticle {
  title: string;
  content: string;
  excerpt: string;
  byline: string | null;
  siteName?: string;
  length?: number;
}

export default function ArticleReader() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [parsedContent, setParsedContent] = useState<ParsedArticle | null>(null);
  const [error, setError] = useState("");
  const [columns, setColumns] = useState<1 | 2 | 3>(1);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  async function loadArticle() {
    try {
      setLoading(true);
      setError("");

      // 1. Get article metadata from Firestore
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

      // 2. Fetch and parse article via Cloud Function
      // The Cloud Function now handles fetching, parsing with JSDOM + Readability
      const proxyArticle = httpsCallable(functions, "proxyArticle");
      const result = await proxyArticle({ url: articleData.url });
      const data = result.data as {
        success: boolean;
        title: string;
        content: string;
        byline?: string;
        excerpt?: string;
        siteName?: string;
        length?: number;
      };

      if (!data.success || !data.content) {
        setError("Could not extract article content");
        return;
      }

      // 3. Sanitize HTML (content is already parsed by Readability on backend)
      const cleanHtml = DOMPurify.sanitize(data.content, {
        ALLOWED_TAGS: [
          'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'strong', 'em', 'u', 'b', 'i', 'a', 'img',
          'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
          'figure', 'figcaption', 'div', 'span'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
      });

      setParsedContent({
        title: data.title || articleData.title,
        content: cleanHtml,
        excerpt: data.excerpt || "",
        byline: data.byline || null,
        siteName: data.siteName,
        length: data.length,
      });

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
          <div className="text-sm text-gray-600">Extracting readable content</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">📰</div>
          <div className="text-2xl mb-4 text-red-600 font-serif">{error}</div>
          <p className="text-gray-600 mb-6">
            {article ? (
              <>
                You can still view the original article at the source website.
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

  if (!article || !parsedContent) {
    return null;
  }

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
          
          {/* Layout Controls */}
          <div className="flex items-center gap-3">
            {/* Column Layout Controls */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <button
                onClick={() => setColumns(1)}
                className={`p-2 rounded transition-colors ${
                  columns === 1
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Single column"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setColumns(2)}
                className={`p-2 rounded transition-colors ${
                  columns === 2
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Two columns"
              >
                <Columns2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setColumns(3)}
                className={`p-2 rounded transition-colors ${
                  columns === 3
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Three columns"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>

            {/* Font Size Controls */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <button
                onClick={() => setFontSize('small')}
                className={`p-2 rounded transition-colors ${
                  fontSize === 'small'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Small font"
              >
                <Type className="w-3 h-3" />
              </button>
              <button
                onClick={() => setFontSize('medium')}
                className={`p-2 rounded transition-colors ${
                  fontSize === 'medium'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Medium font"
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`p-2 rounded transition-colors ${
                  fontSize === 'large'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Large font"
              >
                <Type className="w-5 h-5" />
              </button>
            </div>
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span className="hidden sm:inline">View Original →</span>
            <span className="sm:hidden">Original →</span>
          </a>
        </div>
      </div>

      {/* Article Content */}
      <article className={`mx-auto px-6 py-12 ${
        columns === 1 ? 'max-w-4xl' : columns === 2 ? 'max-w-6xl' : 'max-w-7xl'
      }`}>
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-3 font-serif leading-tight text-gray-900">
          {parsedContent.title}
        </h1>

        {/* Metadata */}
        <div className="text-gray-600 mb-8 pb-6 border-b border-gray-200 space-y-1">
          {parsedContent.byline && (
            <div className="text-sm font-medium text-gray-700">{parsedContent.byline}</div>
          )}
          <div className="text-xs flex flex-wrap gap-2 items-center text-gray-500">
            <span className="font-medium">Source:</span>
            <span>{article.sourceName}</span>
            {article.author && (
              <>
                <span>•</span>
                <span>{article.author}</span>
              </>
            )}
          </div>
        </div>

        {/* Content with Tailwind Typography and Column Layout */}
        <div
          className={`
            ${fontSize === 'small' ? 'prose-sm' : fontSize === 'large' ? 'prose-lg' : 'prose-base'}
            prose max-w-none
            prose-headings:font-serif prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
            ${fontSize === 'small' 
              ? 'prose-h1:text-xl prose-h1:mb-3 prose-h1:mt-6 prose-h2:text-lg prose-h2:mb-2 prose-h2:mt-6 prose-h3:text-base prose-h3:mb-2 prose-h3:mt-4'
              : fontSize === 'large'
              ? 'prose-h1:text-3xl prose-h1:mb-5 prose-h1:mt-10 prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-10 prose-h3:text-xl prose-h3:mb-4 prose-h3:mt-8'
              : 'prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-8 prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-8 prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-6'
            }
            prose-p:font-serif prose-p:text-gray-800 prose-p:leading-relaxed 
            ${fontSize === 'small' ? 'prose-p:mb-3' : fontSize === 'large' ? 'prose-p:mb-5' : 'prose-p:mb-4'}
            prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-em:text-gray-800 prose-em:italic
            prose-img:rounded-lg prose-img:shadow-lg 
            ${fontSize === 'small' ? 'prose-img:my-6' : fontSize === 'large' ? 'prose-img:my-10' : 'prose-img:my-8'}
            prose-img:w-full
            ${fontSize === 'small' ? 'prose-figure:my-6' : fontSize === 'large' ? 'prose-figure:my-10' : 'prose-figure:my-8'}
            prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-gray-600 prose-figcaption:mt-2
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:italic prose-blockquote:text-gray-700 
            ${fontSize === 'small' ? 'prose-blockquote:my-4' : fontSize === 'large' ? 'prose-blockquote:my-8' : 'prose-blockquote:my-6'}
            prose-code:bg-gray-100 prose-code:text-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg 
            ${fontSize === 'small' ? 'prose-pre:my-4' : fontSize === 'large' ? 'prose-pre:my-8' : 'prose-pre:my-6'}
            prose-pre:overflow-x-auto
            ${fontSize === 'small' ? 'prose-ul:my-3 prose-ol:my-3' : fontSize === 'large' ? 'prose-ul:my-5 prose-ol:my-5' : 'prose-ul:my-4 prose-ol:my-4'}
            prose-ul:list-disc prose-ul:pl-5
            prose-ol:list-decimal prose-ol:pl-5
            prose-li:my-1 prose-li:text-gray-800 prose-li:leading-relaxed
            ${fontSize === 'small' ? 'prose-hr:my-6' : fontSize === 'large' ? 'prose-hr:my-10' : 'prose-hr:my-8'}
            prose-hr:border-gray-300
            ${columns === 2 ? 'columns-2 gap-8' : columns === 3 ? 'columns-3 gap-6' : ''}
            ${columns > 1 ? '[column-rule:1px_solid_theme(colors.gray.300)]' : ''}
          `}
          dangerouslySetInnerHTML={{ __html: parsedContent.content }}
        />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">· · ·</p>
            <p className="text-sm text-gray-600 mb-4">End of article</p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              Read original at {article.sourceName}
              <span>→</span>
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}

