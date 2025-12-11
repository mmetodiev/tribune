import { Link } from 'react-router-dom';
import { useSources } from '@/hooks/useSources';

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    // Use Google's favicon service
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    // Fallback if URL parsing fails
    return `https://www.google.com/s2/favicons?domain=${url}&sz=32`;
  }
}

export default function SourcesSidebar() {
  const { sources, loading: sourcesLoading } = useSources({ enabledOnly: true });

  if (sourcesLoading || sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#e8e5dd] p-6 rounded">
      <h3 className="uppercase mb-4 border-b border-gray-300 pb-2 text-xl tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Sources
      </h3>
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="border-b border-gray-300 pb-3 last:border-b-0">
            <Link 
              to={`/source/${source.id}`}
              className="flex items-start gap-3 hover:opacity-80 transition-opacity"
            >
              {/* Favicon on the left */}
              <img 
                src={getFaviconUrl(source.url)} 
                alt={`${source.name} favicon`}
                className="w-8 h-8 flex-shrink-0 mt-0.5"
                onError={(e) => {
                  // Fallback to a default icon if favicon fails to load
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%23ccc"/></svg>';
                }}
              />
              
              {/* Title and count on the right */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base leading-tight">
                  {source.name}
                </div>
                {source.totalArticlesFetched > 0 && (
                  <div className="text-xs text-gray-500">
                    {source.totalArticlesFetched} articles
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
