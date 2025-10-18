import { logger } from "firebase-functions/v2";
import type { Source, FetchResult, NormalizedArticle } from "../types/index.js";
import { fetchRSS } from "../scrapers/rss.js";
import { fetchScrape } from "../scrapers/scraper.js";
import { normalizeArticle } from "../scrapers/normalize.js";
import { saveArticleBatch } from "../storage/articles.js";
import { updateSourceStats } from "../storage/sources.js";
import { categorizeArticles } from "../categorizers/ruleBased.js";
import { updateArticleCategories } from "../storage/articles.js";
import { hashUrl } from "../scrapers/normalize.js";

/**
 * Result of fetching and storing articles from a source
 */
export interface FetchSourceResult {
  success: boolean;
  articleCount: number;
  error: string | null;
}

/**
 * Fetches articles from a source (RSS or scrape) based on its type
 * Does NOT save to database - use for testing
 */
export async function fetchSource(source: Source): Promise<FetchResult> {
  logger.info(`Fetching from source: ${source.name}`, {
    type: source.type,
    url: source.url,
  });

  try {
    let result: FetchResult;

    if (source.type === "rss") {
      result = await fetchRSS(source);
    } else if (source.type === "scrape") {
      result = await fetchScrape(source);
    } else {
      throw new Error(`Unknown source type: ${source.type}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to fetch from source: ${source.name}`, { error: errorMessage });

    return {
      success: false,
      articles: [],
      error: errorMessage,
    };
  }
}

/**
 * Fetches articles from a source and stores them in Firestore with categorization
 * Updates source statistics
 */
export async function fetchAndStoreArticles(
  source: Source
): Promise<FetchSourceResult> {
  logger.info(`Fetching and storing articles from: ${source.name}`);

  try {
    // Fetch raw articles
    const fetchResult = await fetchSource(source);

    if (!fetchResult.success) {
      // Update source with failure
      await updateSourceStats(source.id, false, 0, fetchResult.error);
      return {
        success: false,
        articleCount: 0,
        error: fetchResult.error,
      };
    }

    // Normalize articles
    const normalizedArticles: NormalizedArticle[] = [];
    for (const rawArticle of fetchResult.articles) {
      const normalized = normalizeArticle(rawArticle, source);
      if (normalized) {
        normalizedArticles.push(normalized);
      }
    }

    if (normalizedArticles.length === 0) {
      logger.warn(`No valid articles found for ${source.name}`);
      await updateSourceStats(source.id, true, 0, null);
      return {
        success: true,
        articleCount: 0,
        error: null,
      };
    }

    // Categorize articles
    const categoriesMap = await categorizeArticles(normalizedArticles);

    // Save articles to Firestore
    const savedCount = await saveArticleBatch(normalizedArticles);

    // Update categories for saved articles
    for (const article of normalizedArticles) {
      const categories = categoriesMap.get(article.url);
      if (categories && categories.length > 0) {
        const articleId = hashUrl(article.url);
        await updateArticleCategories(articleId, categories);
      }
    }

    // Update source stats with success
    await updateSourceStats(source.id, true, savedCount, null);

    logger.info(`Successfully processed ${source.name}`, {
      fetched: fetchResult.articles.length,
      normalized: normalizedArticles.length,
      saved: savedCount,
    });

    return {
      success: true,
      articleCount: savedCount,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to fetch and store articles from ${source.name}`, {
      error: errorMessage,
    });

    // Update source with failure
    await updateSourceStats(source.id, false, 0, errorMessage);

    return {
      success: false,
      articleCount: 0,
      error: errorMessage,
    };
  }
}
