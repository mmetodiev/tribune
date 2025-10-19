import { Link } from 'react-router-dom';
import type { Article } from '@/types';

interface ArticleItemProps {
  article: Article;
  variant?: 'large' | 'small';
}

export default function ArticleItem({ article, variant = 'large' }: ArticleItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Allow opening original with Cmd/Ctrl+Click
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      window.open(article.url, '_blank');
    }
  };

  if (variant === 'small') {
    // Compact variant for row 3
    return (
      <div className="break-inside-avoid mb-4">
        <div className="mb-2">
          <Link 
            to={`/article/${article.id}`}
            className="hover:underline"
            onClick={handleClick}
          >
            <h4 className="font-bold text-base inline" style={{ fontFamily: 'Lato, sans-serif' }}>
              {article.title}
            </h4>
          </Link>
          <span className="text-xs text-gray-600"> · {article.sourceName}</span>
        </div>

        {/* Show RSS summary first, fall back to extractedSummary */}
        {(article.summary || article.extractedSummary) && (
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
            {article.summary || article.extractedSummary}
          </p>
        )}
      </div>
    );
  }

  // Large variant for rows 1 & 2
  return (
    <div className="break-inside-avoid mb-6">
      <div className="mb-2 pb-2 border-b border-[#2f2f2f]">
        <Link 
          to={`/article/${article.id}`}
          className="hover:underline"
          onClick={handleClick}
        >
          <h3 className="font-bold text-lg inline" style={{ fontFamily: 'Lato, sans-serif' }}>
            {article.title}
          </h3>
        </Link>
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
  );
}

