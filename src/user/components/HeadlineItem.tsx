import { Link } from 'react-router-dom';
import type { Article } from '@/types';

interface HeadlineItemProps {
  article: Article;
  showBorder?: boolean;
}

export default function HeadlineItem({ article, showBorder = true }: HeadlineItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Allow opening original with Cmd/Ctrl+Click
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      window.open(article.url, '_blank');
    }
  };

  return (
    <div className={showBorder ? "border-b border-gray-400 pb-2" : "pb-2"}>
      <Link 
        to={`/article/${article.id}`}
        className="hover:underline"
        onClick={handleClick}
      >
        <h4 className="font-bold text-sm leading-snug" style={{ fontFamily: 'Lato, sans-serif' }}>
          {article.title}
        </h4>
      </Link>
    </div>
  );
}

