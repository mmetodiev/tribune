import { initializeApp } from "firebase-admin/app";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { parseFeed } from "feedsmith";
import { createHash } from "crypto";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// ============================================================================
// TYPES
// ============================================================================

interface Source {
  id: string;
  name: string;
  url: string;
  type: "rss";
  enabled: boolean;
  updateFrequency: "hourly" | "daily" | "manual";
  status: "active" | "error" | "disabled";
  lastFetchedAt: Timestamp | null;
  lastSuccessAt: Timestamp | null;
  consecutiveFailures: number;
  totalArticlesFetched: number;
  errorMessage: string;
}

interface RawArticle {
  title?: string;
  headline?: string;
  url?: string;
  link?: string;
  summary?: string;
  description?: string;
  author?: string;
  pubDate?: string;
  published?: string;
  image?: string;
  thumbnail?: string;
}

interface NormalizedArticle {
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  summary: string;
  author: string;
  publishedDate: Date | null;
  imageUrl: string;
  fetchedAt: Date;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Hash URL to create unique article ID
 */
function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

/**
 * Parse date string to Date object
 */
function parseDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Normalize raw RSS article to our format
 */
function normalizeArticle(raw: RawArticle, source: Source): NormalizedArticle | null {
  const title = raw.title || raw.headline || "";
  const url = raw.url || raw.link || "";
  
  if (!title || !url) {
    return null; // Skip articles without title or URL
  }

  return {
    title: title.trim(),
    url: url.trim(),
    sourceId: source.id,
    sourceName: source.name,
    summary: (raw.summary || raw.description || "").trim(),
    author: (raw.author || "").trim(),
    publishedDate: parseDate(raw.pubDate || raw.published),
    imageUrl: (raw.image || raw.thumbnail || "").trim(),
    fetchedAt: new Date(),
  };
}

/**
 * Fetch and parse RSS feed
 */
async function fetchRSSFeed(source: Source): Promise<{ success: boolean; articles: RawArticle[]; error: string | null }> {
  try {
    logger.info(`Fetching RSS feed from ${source.name}`, { url: source.url });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    let response;
    try {
      response = await fetch(source.url, {
        signal: controller.signal,
        headers: { "User-Agent": "Tribune News Aggregator/1.0" },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const feedContent = await response.text();
    const result = parseFeed(feedContent);
    
    logger.info(`Detected feed format: ${result.format}`, { source: source.name });

    const articles: RawArticle[] = [];

    if (result.format === 'rss') {
      const feed = result.feed as any;
      if (feed.items) {
        for (const item of feed.items) {
          articles.push({
            title: item.title || "",
            url: item.link || "",
            summary: item.description || item.content?.encoded || "",
            author: item.dc?.creator || (item.authors?.[0] as any) || "",
            pubDate: item.pubDate || "",
            image: item.enclosures?.[0]?.url || item.media?.thumbnails?.[0]?.url || "",
          });
        }
      }
    } else if (result.format === 'atom') {
      const feed = result.feed as any;
      if (feed.entries) {
        for (const entry of feed.entries) {
          const links = entry.links || [];
          articles.push({
            title: entry.title || "",
            url: entry.links?.[0]?.href || entry.id || "",
            summary: entry.content || entry.summary || "",
            author: entry.authors?.[0]?.name || "",
            pubDate: entry.published || entry.updated || "",
            image: links.find((l: any) => l.rel === 'enclosure')?.href || "",
          });
        }
      }
    } else if (result.format === 'json') {
      const feed = result.feed as any;
      if (feed.items) {
        for (const item of feed.items) {
          articles.push({
            title: item.title || "",
            url: item.url || item.id || "",
            summary: item.content_html || item.content_text || item.summary || "",
            author: item.authors?.[0]?.name || "",
            pubDate: item.date_published || item.date_modified || "",
            image: item.image || item.banner_image || "",
          });
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
          article.summary = "";
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
    return { success: false, articles: [], error: `RSS fetch failed: ${errorMessage}` };
  }
}

/**
 * Save article to Firestore (with deduplication)
 */
async function saveArticle(article: NormalizedArticle): Promise<boolean> {
  try {
    const articleId = hashUrl(article.url);
    const docRef = db.collection("articles").doc(articleId);

    // Check if article already exists
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
      return false; // Not new
    }

    // Save new article
    await docRef.set({
      title: article.title,
      url: article.url,
      sourceId: article.sourceId,
      sourceName: article.sourceName,
      summary: article.summary,
      author: article.author,
      publishedDate: article.publishedDate ? Timestamp.fromDate(article.publishedDate) : null,
      imageUrl: article.imageUrl,
      fetchedAt: Timestamp.fromDate(article.fetchedAt),
      read: false,
      bookmarked: false,
      hidden: false,
    });

    return true; // New article
  } catch (error) {
    logger.error("Failed to save article", { url: article.url, error });
    throw error;
  }
}

/**
 * Update source statistics
 */
async function updateSourceStats(
  sourceId: string,
  success: boolean,
  articleCount: number,
  error: string | null
): Promise<void> {
  const sourceRef = db.collection("sources").doc(sourceId);
  const now = Timestamp.now();

  if (success) {
    await sourceRef.update({
      lastFetchedAt: now,
      lastSuccessAt: now,
      consecutiveFailures: 0,
      status: "active",
      errorMessage: "",
      totalArticlesFetched: FieldValue.increment(articleCount),
    });
  } else {
    const sourceDoc = await sourceRef.get();
    const currentFailures = sourceDoc.data()?.consecutiveFailures || 0;
    
    await sourceRef.update({
      lastFetchedAt: now,
      consecutiveFailures: currentFailures + 1,
      status: "error",
      errorMessage: error || "Unknown error",
    });
  }
}

/**
 * Fetch articles from a single source
 */
async function fetchSourceArticles(source: Source): Promise<{ success: boolean; articleCount: number; error: string | null }> {
  try {
    const fetchResult = await fetchRSSFeed(source);

    if (!fetchResult.success) {
      await updateSourceStats(source.id, false, 0, fetchResult.error);
      return { success: false, articleCount: 0, error: fetchResult.error };
    }

    // Normalize and save articles
    let savedCount = 0;
    for (const rawArticle of fetchResult.articles) {
      const normalized = normalizeArticle(rawArticle, source);
      if (normalized) {
        const isNew = await saveArticle(normalized);
        if (isNew) {
          savedCount++;
        }
      }
    }

    await updateSourceStats(source.id, true, savedCount, null);
    logger.info(`Saved ${savedCount} new articles from ${source.name}`);
    
    return { success: true, articleCount: savedCount, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to fetch articles from ${source.name}`, { error: errorMessage });
    await updateSourceStats(source.id, false, 0, errorMessage);
    return { success: false, articleCount: 0, error: errorMessage };
  }
}

// ============================================================================
// CLOUD FUNCTIONS
// ============================================================================

/**
 * Scheduled function: Fetch RSS feeds every hour
 */
export const scheduledFetchRSS = onSchedule("every 1 hours", async (event) => {
  logger.info("Starting scheduled RSS fetch");

  try {
    // Get all enabled RSS sources
    const sourcesSnapshot = await db
      .collection("sources")
      .where("enabled", "==", true)
      .where("type", "==", "rss")
      .get();

    if (sourcesSnapshot.empty) {
      logger.info("No enabled RSS sources found");
      return;
    }

    const sources = sourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Source[];

    logger.info(`Fetching ${sources.length} RSS sources`);

    // Fetch articles from each source
    for (const source of sources) {
      await fetchSourceArticles(source);
    }

    logger.info("Scheduled RSS fetch completed");
  } catch (error) {
    logger.error("Scheduled RSS fetch failed", { error });
  }
});

/**
 * Manual fetch: Fetch articles from a specific source
 */
export const manualFetchSource = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const { id } = request.data;
    if (!id) {
      throw new HttpsError("invalid-argument", "Source ID is required");
    }

    const sourceDoc = await db.collection("sources").doc(id).get();
    if (!sourceDoc.exists) {
      throw new HttpsError("not-found", "Source not found");
    }

    const source = { id: sourceDoc.id, ...sourceDoc.data() } as Source;
    
    if (source.type !== "rss") {
      throw new HttpsError("invalid-argument", "Only RSS sources are supported");
    }

    const result = await fetchSourceArticles(source);
    
    return {
      success: result.success,
      articleCount: result.articleCount,
      error: result.error,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("manualFetchSource failed", { error });
    throw new HttpsError("internal", "Failed to fetch source");
  }
});

/**
 * Manual fetch: Fetch articles from all enabled sources
 */
export const manualFetchAll = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const sourcesSnapshot = await db
      .collection("sources")
      .where("enabled", "==", true)
      .where("type", "==", "rss")
      .get();

    if (sourcesSnapshot.empty) {
      return { success: true, totalArticles: 0, sourcesProcessed: 0 };
    }

    const sources = sourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Source[];

    let totalArticles = 0;
    let errors = 0;

    for (const source of sources) {
      const result = await fetchSourceArticles(source);
      if (result.success) {
        totalArticles += result.articleCount;
      } else {
        errors++;
      }
    }

    return {
      success: true,
      totalArticles,
      sourcesProcessed: sources.length,
      errors,
    };
  } catch (error) {
    logger.error("manualFetchAll failed", { error });
    throw new HttpsError("internal", "Failed to fetch all sources");
  }
});

/**
 * Test RSS feed URL (for validation)
 */
export const testRSSFeed = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const { url } = request.data;
    if (!url) {
      throw new HttpsError("invalid-argument", "URL is required");
    }

    // Create a temporary source object for testing
    const testSource: Source = {
      id: "test",
      name: "Test Source",
      url: url,
      type: "rss",
      enabled: true,
      updateFrequency: "manual",
      status: "active",
      lastFetchedAt: null,
      lastSuccessAt: null,
      consecutiveFailures: 0,
      totalArticlesFetched: 0,
      errorMessage: "",
    };

    const result = await fetchRSSFeed(testSource);
    
    if (result.success) {
      return {
        success: true,
        articleCount: result.articles.length,
        articles: result.articles.slice(0, 5), // Return first 5 as preview
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("testRSSFeed failed", { error });
    throw new HttpsError("internal", "Failed to test RSS feed");
  }
});

/**
 * Cleanup old articles: Delete articles older than specified days
 */
export const cleanupOldArticles = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const { daysToKeep } = request.data;
    const retentionDays = daysToKeep || 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    // Get all articles older than cutoff date
    const articlesSnapshot = await db
      .collection("articles")
      .where("fetchedAt", "<", cutoffTimestamp)
      .get();

    if (articlesSnapshot.empty) {
      return { success: true, deletedCount: 0 };
    }

    // Delete in batches (Firestore limit is 500 operations per batch)
    const batches: any[] = [];
    let currentBatch = db.batch();
    let batchCount = 0;
    let totalDeleted = 0;

    articlesSnapshot.docs.forEach((doc) => {
      currentBatch.delete(doc.ref);
      batchCount++;
      totalDeleted++;

      if (batchCount === 500) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        batchCount = 0;
      }
    });

    // Add the last batch if it has operations
    if (batchCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    await Promise.all(batches.map((batch) => batch.commit()));

    logger.info(`Deleted ${totalDeleted} old articles (older than ${retentionDays} days)`);

    return {
      success: true,
      deletedCount: totalDeleted,
    };
  } catch (error) {
    logger.error("cleanupOldArticles failed", { error });
    throw new HttpsError("internal", "Failed to cleanup articles");
  }
});
