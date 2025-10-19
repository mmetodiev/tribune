import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface Props {
  articleId?: string;
  articleUrl?: string;
  articleTitle?: string;
}

interface TestResult {
  success: boolean;
  fullText?: string;
  extractedSummary?: string;
  wordCount?: number;
  paragraphs?: number;
  method?: string;
  error?: string;
}

export function TextExtractionTester({ articleId, articleUrl, articleTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testUrl, setTestUrl] = useState(articleUrl || '');

  async function handleTest() {
    if (!testUrl) {
      alert('Please provide a URL');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const fn = httpsCallable(functions, 'testTextExtraction');
      const response: any = await fn({
        url: testUrl,
        articleId: articleId,
      });

      setResult(response.data);
    } catch (err) {
      console.error('Test failed:', err);
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">🔬 Test Text Extraction</h3>
        {articleTitle && (
          <p className="text-sm text-gray-600 mb-2">Article: {articleTitle}</p>
        )}
      </div>

      {/* URL Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Article URL
        </label>
        <input
          type="url"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={loading || !testUrl}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Testing...
          </span>
        ) : (
          'Test Extraction'
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6">
          {result.success ? (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-lg">✅</span>
                  <span className="font-medium">Extraction Successful</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Word Count</div>
                  <div className="text-2xl font-bold text-gray-900">{result.wordCount || 0}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Paragraphs</div>
                  <div className="text-2xl font-bold text-gray-900">{result.paragraphs || 0}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Method</div>
                  <div className="text-sm font-semibold text-blue-600 mt-1">{result.method || 'extractive'}</div>
                </div>
              </div>

              {/* Generated Summary */}
              {result.extractedSummary && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Summary (1-2 sentences)
                  </label>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-gray-800 leading-relaxed">{result.extractedSummary}</p>
                  </div>
                </div>
              )}

              {/* Full Text Preview */}
              {result.fullText && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extracted Text (first 500 chars)
                  </label>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {result.fullText.substring(0, 500)}
                      {result.fullText.length > 500 && '...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-lg">❌</span>
                <div>
                  <div className="font-medium text-red-800 mb-1">Extraction Failed</div>
                  <p className="text-sm text-red-700">{result.error || 'Unknown error'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

