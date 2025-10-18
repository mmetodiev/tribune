import { useState, useEffect } from "react";
import { Source, RawArticle } from "@/types";
import { testSource } from "@/lib/api";

interface TestSourceModalProps {
  source: Source;
  onClose: () => void;
}

export default function TestSourceModal({ source, onClose }: TestSourceModalProps) {
  const [testing, setTesting] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runTest();
  }, []);

  const runTest = async () => {
    try {
      setTesting(true);
      setError(null);
      const data = await testSource(source.id);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Test Source: {source.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {testing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Testing source...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded">
              <h3 className="font-semibold mb-2">Test Failed</h3>
              <p>{error}</p>
            </div>
          )}

          {result && !testing && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Test Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Status:</span>{" "}
                    <span
                      className={`font-semibold ${
                        result.success ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {result.success ? "Success" : "Failed"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Articles Found:</span>{" "}
                    <span className="font-semibold">{result.articleCount}</span>
                  </div>
                </div>
                {result.error && (
                  <div className="mt-3 text-red-600">
                    <span className="font-semibold">Error:</span> {result.error}
                  </div>
                )}
              </div>

              {/* Articles Preview */}
              {result.articles && result.articles.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Preview (First {result.articles.length} articles)
                  </h3>
                  <div className="space-y-4">
                    {result.articles.map((article: RawArticle, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded p-4 hover:bg-gray-50"
                      >
                        <h4 className="font-medium text-gray-900 mb-2">
                          {article.title || article.headline || "No title"}
                        </h4>
                        {(article.summary || article.description) && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {article.summary || article.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {article.url || article.link || "No URL"}
                          </span>
                          {(article.pubDate || article.published) && (
                            <span>
                              {article.pubDate || article.published}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <details className="border border-gray-200 rounded">
                <summary className="p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 font-medium">
                  View Raw Data
                </summary>
                <div className="p-4 bg-gray-900 text-gray-100 overflow-x-auto">
                  <pre className="text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={runTest}
            disabled={testing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? "Testing..." : "Test Again"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
