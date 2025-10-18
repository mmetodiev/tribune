import Parser from "rss-parser";
import { logger } from "firebase-functions/v2";
import type { Source, FetchResult, RawArticle } from "../types/index.js";

/**
 * Fetches and parses RSS/Atom feeds from a given source
 * @param source - The news source configuration
 * @returns FetchResult containing success status, articles array, and any error
 */
export async function fetchRSS(source: Source): Promise<FetchResult> {
  try {
    logger.info(`Fetching RSS feed from ${source.name}`, { url: source.url });

    const parser = new Parser({
      timeout: 10000,
      headers: { "User-Agent": "Tribune News Aggregator/1.0" },
    });

    const feed = await parser.parseURL(source.url);

    const articles: RawArticle[] = feed.items.map((item) => ({
      title: item.title,
      url: item.link,
      summary: item.contentSnippet || item.content || item.description,
      author: item.creator || item.author,
      pubDate: item.pubDate || item.isoDate,
      image: item.enclosure?.url,
    }));

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
