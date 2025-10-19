import { logger } from "firebase-functions/v2";
import type { Source, FetchResult, NormalizedArticle } from "../types/index.js";
import { fetchRSS } from "../scrapers/rss.js";
import { fetchScrape } from "../scrapers/scraper.js";
import { normalizeArticle } from "../scrapers/normalize.js";
import { saveArticleBatch } from "../storage/articles.js";
import { updateSourceStats } from "../storage/sources.js";
import { extractArticleText, validateExtractedText } from "../scrapers/textExtractor.js";
import { createShortSummary } from "../summarizers/extractive.js";

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

    // Text extraction & summarization pipeline
    // Only extract when RSS summary is missing or too short (< 80 chars)
    // This prioritizes RSS summaries and reduces unnecessary processing
    logger.info(`Analyzing ${normalizedArticles.length} articles for text extraction`);
    
    const enrichedArticles = await Promise.all(
      normalizedArticles.map(async (article) => {
        try {
          // Skip extraction if RSS already provides a good summary
          const hasGoodRSSSummary = article.summary && article.summary.length > 80;
          
          if (hasGoodRSSSummary) {
            logger.debug(`Skipping extraction for "${article.title}" (has RSS summary)`);
            return article;
          }
          
          // Extract text for articles without good RSS summaries
          logger.info(`Extracting text for "${article.title}" (no/short RSS summary)`);
          const textResult = await extractArticleText(article.url);
          
          // Only add text extraction if successful
          if (textResult.success && validateExtractedText(textResult)) {
            article.fullText = textResult.fullText;
            article.wordCount = textResult.wordCount;
            
            // Generate extractive summary from extracted text
            const summaryResult = createShortSummary(textResult.fullText);
            
            if (summaryResult.success) {
              article.extractedSummary = summaryResult.summary;
              article.summarizedAt = new Date();
              article.summarizationMethod = "extractive";
              
              logger.info(`Enriched article: ${article.title}`, {
                wordCount: article.wordCount,
                summaryLength: article.extractedSummary.length,
              });
            }
          } else {
            // Log but don't fail - article can still be saved without extraction
            logger.warn(`Text extraction failed for: ${article.title}`, {
              url: article.url,
              error: textResult.error,
            });
          }
        } catch (error) {
          // Log error but continue - extraction is optional enhancement
          logger.error(`Error enriching article: ${article.title}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
        
        return article;
      })
    );

    logger.info(`Text extraction complete`, {
      total: enrichedArticles.length,
      skipped: enrichedArticles.filter(a => a.summary && a.summary.length > 80).length,
      extracted: enrichedArticles.filter(a => a.fullText).length,
      withExtractedSummary: enrichedArticles.filter(a => a.extractedSummary).length,
    });

    // Save enriched articles to Firestore (includes text extraction & summaries)
    const savedCount = await saveArticleBatch(enrichedArticles);

    // Update source stats with success
    await updateSourceStats(source.id, true, savedCount, null);

    logger.info(`Successfully processed ${source.name}`, {
      fetched: fetchResult.articles.length,
      normalized: normalizedArticles.length,
      enriched: enrichedArticles.filter(a => a.extractedSummary).length,
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
