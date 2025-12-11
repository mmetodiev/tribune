/**
 * Article Extractor Service
 * 
 * Abstraction layer for extracting full article content using Readability.
 * Designed to easily switch between Firebase Functions and HTTP endpoints (Heroku/Ubuntu).
 * 
 * Architecture:
 * - Firebase Functions (default): Uses Firebase callable functions
 * - HTTP Endpoint (future): Can switch to Heroku/Ubuntu server via environment variable
 */

export interface ArticleExtractionResult {
  success: boolean;
  content?: string; // HTML content from Readability
  textContent?: string; // Plain text version
  title?: string;
  byline?: string;
  excerpt?: string;
  siteName?: string;
  error?: string;
}

export interface ArticleExtractor {
  extractArticle(url: string): Promise<ArticleExtractionResult>;
}

/**
 * Firebase Functions implementation
 * Uses Firebase callable functions
 */
class FirebaseFunctionExtractor implements ArticleExtractor {
  async extractArticle(url: string): Promise<ArticleExtractionResult> {
    try {
      const { httpsCallable } = await import("firebase/functions");
      const { functions } = await import("@/lib/firebase");

      const proxyArticle = httpsCallable(functions, "proxyArticle");
      
      console.log("Calling proxyArticle function for URL:", url);
      const result = await proxyArticle({ url });

      const data = result.data as any;

      if (data && data.success) {
        return {
          success: true,
          content: data.content,
          textContent: data.textContent,
          title: data.title,
          byline: data.byline,
          excerpt: data.excerpt,
          siteName: data.siteName,
        };
      } else {
        return {
          success: false,
          error: data?.error || "Failed to extract article",
        };
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error?.code || "unknown";
      const errorDetails = error?.details || "";
      
      console.error("Firebase function extraction failed:", {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        error: error,
      });
      
      return {
        success: false,
        error: errorMessage || "Failed to extract article",
      };
    }
  }
}

/**
 * HTTP Endpoint implementation
 * For use with Heroku/Ubuntu server
 * Includes rate limiting and retry logic
 */
class HttpEndpointExtractor implements ArticleExtractor {
  private baseUrl: string;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second between requests
  private readonly maxRetries = 3;
  private readonly retryDelays = [2000, 5000, 10000]; // Exponential backoff in ms

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Rate-limited fetch with retry logic
   */
  private async rateLimitedFetch(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
    // Wait if we're making requests too quickly
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url, options);

      // Handle rate limiting (429) with retry
      if (response.status === 429 && retryCount < this.maxRetries) {
        const delay = this.retryDelays[retryCount] || 10000;
        console.warn(`Rate limited (429). Retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.rateLimitedFetch(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelays[retryCount] || 10000;
        console.warn(`Network error. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.rateLimitedFetch(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  async extractArticle(url: string): Promise<ArticleExtractionResult> {
    try {
      const response = await this.rateLimitedFetch(
        `${this.baseUrl}/api/extract-article`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!response.ok) {
        // If still rate limited after retries, return error
        if (response.status === 429) {
          return {
            success: false,
            error: "Rate limit exceeded. Please try again in a moment.",
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          content: data.content,
          textContent: data.textContent,
          title: data.title,
          byline: data.byline,
          excerpt: data.excerpt,
          siteName: data.siteName,
        };
      } else {
        return {
          success: false,
          error: data.error || "Failed to extract article",
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("HTTP endpoint extraction failed:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

/**
 * Factory function to create the appropriate extractor
 * Checks environment variable to determine which implementation to use
 */
function createExtractor(): ArticleExtractor {
  // Check for custom HTTP endpoint URL
  const httpEndpointUrl = import.meta.env.VITE_ARTICLE_EXTRACTOR_URL;

  if (httpEndpointUrl) {
    console.log("Using HTTP endpoint extractor:", httpEndpointUrl);
    return new HttpEndpointExtractor(httpEndpointUrl);
  }

  // Default to Firebase Functions
  console.log("Using Firebase Functions extractor");
  return new FirebaseFunctionExtractor();
}

// Export singleton instance
export const articleExtractor: ArticleExtractor = createExtractor();

/**
 * Convenience function for extracting article content
 */
export async function extractArticle(url: string): Promise<ArticleExtractionResult> {
  return articleExtractor.extractArticle(url);
}

