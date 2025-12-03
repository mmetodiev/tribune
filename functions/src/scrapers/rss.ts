import { parseFeed } from "feedsmith";
import { logger } from "firebase-functions/v2";
import type { Source, FetchResult, RawArticle } from "../types/index.js";

/**
 * Fetches and parses RSS/Atom feeds from a given source
 * Uses Feedsmith parser which preserves HTML content and original feed structure
 * @param source - The news source configuration
 * @returns FetchResult containing success status, articles array, and any error
 */
export async function fetchRSS(source: Source): Promise<FetchResult> {
  try {
    logger.info(`Fetching RSS feed from ${source.name}`, { url: source.url });

    // Fetch the feed content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: { "User-Agent": "Tribune News Aggregator/1.0" },
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const feedContent = await response.text();

    // Parse with Feedsmith (auto-detects RSS/Atom/RDF/JSON Feed)
    const result = parseFeed(feedContent);
    
    logger.info(`Detected feed format: ${result.format}`, { source: source.name });

    // Map feed items to RawArticle format
    const articles: RawArticle[] = [];

    if (result.format === 'rss') {
      const feed = result.feed as any; // Use any for now due to complex Feedsmith types
      if (!feed.items) {
        logger.warn(`No items found in RSS feed for ${source.name}`);
        return { success: true, articles: [], error: null };
      }

      for (const item of feed.items) {
        // RSS feed - preserve HTML content from description
        const title = item.title || "";
        const url = item.link || "";
        // Prioritize description (often has HTML) over content:encoded
        const summary = item.description || item.content?.encoded || "";
        const author = item.dc?.creator || (item.authors?.[0] as any) || "";
        const pubDate = item.pubDate || "";
        const image = item.enclosures?.[0]?.url || item.media?.thumbnails?.[0]?.url || "";

        if (title && url) {
          articles.push({ title, url, summary, author, pubDate, image });
        }
      }
    } else if (result.format === 'atom') {
      const feed = result.feed as any;
      if (!feed.entries) {
        logger.warn(`No entries found in Atom feed for ${source.name}`);
        return { success: true, articles: [], error: null };
      }

      for (const entry of feed.entries) {
        // Atom feed - content can be HTML
        const title = entry.title || "";
        const url = entry.links?.[0]?.href || entry.id || "";
        const summary = entry.content || entry.summary || "";
        const author = entry.authors?.[0]?.name || "";
        const pubDate = entry.published || entry.updated || "";
        const links = entry.links || [];
        const image = links.find((l: any) => l.rel === 'enclosure')?.href || "";

        if (title && url) {
          articles.push({ title, url, summary, author, pubDate, image });
        }
      }
    } else if (result.format === 'rdf') {
      const feed = result.feed as any;
      if (!feed.items) {
        logger.warn(`No items found in RDF feed for ${source.name}`);
        return { success: true, articles: [], error: null };
      }

      for (const item of feed.items) {
        // RDF feed
        const title = item.title || "";
        const url = item.link || "";
        const summary = item.description || item.content?.encoded || "";
        const author = item.dc?.creator || "";
        const pubDate = item.dc?.date || "";
        const image = "";

        if (title && url) {
          articles.push({ title, url, summary, author, pubDate, image });
        }
      }
    } else if (result.format === 'json') {
      const feed = result.feed as any;
      if (!feed.items) {
        logger.warn(`No items found in JSON feed for ${source.name}`);
        return { success: true, articles: [], error: null };
      }

      for (const item of feed.items) {
        // JSON Feed - content_html has HTML
        const title = item.title || "";
        const url = item.url || item.id || "";
        const summary = item.content_html || item.content_text || item.summary || "";
        const author = item.authors?.[0]?.name || "";
        const pubDate = item.date_published || item.date_modified || "";
        const image = item.image || item.banner_image || "";

        if (title && url) {
          articles.push({ title, url, summary, author, pubDate, image });
        }
      }
    }

    // Filter out junk summaries
    const junkPatterns = [
      /^comments$/i,
      /^read more$/i,
      /^continue reading$/i,
      /^view article$/i,
      /^click here$/i,
    ];

    for (const article of articles) {
      if (article.summary && typeof article.summary === 'string') {
        const trimmed = article.summary.trim();
        const isJunk = junkPatterns.some(pattern => pattern.test(trimmed));
        const isTooShort = trimmed.length < 20;
        
        if (isJunk || isTooShort) {
          article.summary = ""; // Clear junk summaries
        }
      }
    }

    logger.info(`Successfully fetched ${articles.length} articles from ${source.name}`);

    return { success: true, articles, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`RSS fetch failed for ${source.name}`, {
      error: errorMessage,
      url: source.url,
    });

    return {
      success: false,
      articles: [],
      error: `RSS fetch failed: ${errorMessage}`,
    };
  }
}
