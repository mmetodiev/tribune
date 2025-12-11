import { Link } from 'react-router-dom';
import { useSources } from '@/hooks/useSources';

export default function SourcesSidebar() {
  const { sources, loading: sourcesLoading } = useSources({ enabledOnly: true });

  if (sourcesLoading || sources.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="uppercase mb-4 border-b border-[#2f2f2f] pb-2 text-xl tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Sources
      </h3>
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="border-b border-[#2f2f2f] pb-3 last:border-b-0">
            <Link 
              to={`/source/${source.id}`}
              className="font-semibold text-base mb-1 hover:underline block"
            >
              {source.name}
            </Link>
            {source.totalArticlesFetched > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {source.totalArticlesFetched} articles
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
