import { initializeApp } from "firebase-admin/app";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import type { CallableRequest } from "firebase-functions/v2/https";

// Initialize Firebase Admin
initializeApp();

// Import storage functions
import {
  addSource,
  updateSource,
  deleteSource,
  toggleSource,
  getSource,
  getAllSources,
  type CreateSourceData,
} from "./storage/sources.js";

import {
  getArticlesBySource,
  getRecentArticles,
  deleteOldArticles,
} from "./storage/articles.js";

import { getSerendipityArticles as fetchSerendipityArticles } from "./storage/serendipity.js";

// Categories removed in Sprint 8 - focusing on serendipity

import { fetchSource, fetchAndStoreArticles } from "./core/fetchSource.js";
import { getRecentFetchLogs, createFetchLog } from "./storage/fetchLogs.js";
import type { Source, FetchLogDetail } from "./types/index.js";

/**
 * Helper function to require authentication
 */
function requireAuth(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
}

// ============================================================================
// SOURCE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Creates a new news source
 */
export const createSource = onCall(async (request) => {
  requireAuth(request);

  try {
    const sourceData = request.data as CreateSourceData;
    logger.info("createSource called", { sourceData });
    const sourceId = await addSource(sourceData);
    return { success: true, sourceId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("createSource failed", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new HttpsError("internal", "Failed to create source");
  }
});

/**
 * Updates an existing source
 */
export const modifySource = onCall(async (request) => {
  requireAuth(request);

  try {
    const { id, updates } = request.data;
    await updateSource(id, updates);
    return { success: true };
  } catch (error) {
    logger.error("modifySource failed", { error });
    throw new HttpsError("internal", "Failed to update source");
  }
});

/**
 * Deletes a source
 */
export const removeSource = onCall(async (request) => {
  requireAuth(request);

  try {
    const { id } = request.data;
    await deleteSource(id);
    return { success: true };
  } catch (error) {
    logger.error("removeSource failed", { error });
    throw new HttpsError("internal", "Failed to delete source");
  }
});

/**
 * Toggles a source's enabled status
 */
export const toggleSourceStatus = onCall(async (request) => {
  requireAuth(request);

  try {
    const { id } = request.data;
    await toggleSource(id);
    return { success: true };
  } catch (error) {
    logger.error("toggleSourceStatus failed", { error });
    throw new HttpsError("internal", "Failed to toggle source");
  }
});

/**
 * Gets all sources
 */
export const getSources = onCall(async (request) => {
  requireAuth(request);

  try {
    const sources = await getAllSources();
    return { success: true, sources };
  } catch (error) {
    logger.error("getSources failed", { error });
    throw new HttpsError("internal", "Failed to get sources");
  }
});

/**
 * Tests a source by fetching articles without saving
 */
export const testSource = onCall(async (request) => {
  requireAuth(request);

  try {
    const { id } = request.data;
    const source = await getSource(id);

    if (!source) {
      throw new HttpsError("not-found", "Source not found");
    }

    const result = await fetchSource(source);
    return {
      success: result.success,
      articleCount: result.articles.length,
      articles: result.articles.slice(0, 5), // Return first 5 for preview
      error: result.error,
    };
  } catch (error) {
    logger.error("testSource failed", { error });
    throw new HttpsError("internal", "Failed to test source");
  }
});

// ============================================================================
// ARTICLE FUNCTIONS
// ============================================================================

/**
 * Gets articles by source
 */
export const getSourceArticles = onCall(async (request) => {
  requireAuth(request);

  try {
    const { sourceId, limit } = request.data;
    const articles = await getArticlesBySource(sourceId, limit);
    return { success: true, articles };
  } catch (error) {
    logger.error("getSourceArticles failed", { error });
    throw new HttpsError("internal", "Failed to get articles");
  }
});

// getCategoryArticles removed in Sprint 8 - categories system removed

/**
 * Gets recent articles
 */
export const getArticles = onCall(async (request) => {
  requireAuth(request);

  try {
    const { limit } = request.data || {};
    const articles = await getRecentArticles(limit);
    return { success: true, articles };
  } catch (error) {
    logger.error("getArticles failed", { error });
    throw new HttpsError("internal", "Failed to get articles");
  }
});

/**
 * Gets serendipity articles (last 3 days, evenly distributed across sources, randomized)
 */
export const getSerendipityArticles = onCall(async (request) => {
  requireAuth(request);

  try {
    const { totalArticles } = request.data || { totalArticles: 20 };
    const articles = await fetchSerendipityArticles(totalArticles);
    return { success: true, articles };
  } catch (error) {
    logger.error("getSerendipityArticles failed", { error });
    throw new HttpsError("internal", "Failed to get serendipity articles");
  }
});

/**
 * Deletes old articles
 */
export const cleanupOldArticles = onCall(async (request) => {
  requireAuth(request);

  try {
    const { daysToKeep } = request.data;
    const deletedCount = await deleteOldArticles(daysToKeep || 30);
    return { success: true, deletedCount };
  } catch (error) {
    logger.error("cleanupOldArticles failed", { error });
    throw new HttpsError("internal", "Failed to cleanup articles");
  }
});

// ============================================================================
// CATEGORY FUNCTIONS - REMOVED IN SPRINT 8
// ============================================================================
// Categories system removed to focus on serendipity and random article distribution

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Manually triggers a fetch for a specific source
 */
export const manualFetchSource = onCall(async (request) => {
  requireAuth(request);

  try {
    const { id } = request.data;
    const source = await getSource(id);

    if (!source) {
      throw new HttpsError("not-found", "Source not found");
    }

    const result = await fetchAndStoreArticles(source);
    return {
      success: result.success,
      articleCount: result.articleCount,
      error: result.error,
    };
  } catch (error) {
    logger.error("manualFetchSource failed", { error });
    throw new HttpsError("internal", "Failed to fetch source");
  }
});

/**
 * Manually triggers a fetch for all enabled sources
 */
export const manualFetchAll = onCall(async (request) => {
  requireAuth(request);

  try {
    const sources = await getAllSources();
    const enabledSources = sources.filter((s: Source) => s.enabled);

    const results = await Promise.allSettled(
      enabledSources.map((source: Source) => fetchAndStoreArticles(source))
    );

    const details: FetchLogDetail[] = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          sourceId: enabledSources[index].id,
          sourceName: enabledSources[index].name,
          success: result.value.success,
          articleCount: result.value.articleCount,
          error: result.value.error,
        };
      } else {
        return {
          sourceId: enabledSources[index].id,
          sourceName: enabledSources[index].name,
          success: false,
          articleCount: 0,
          error: result.reason?.message || "Unknown error",
        };
      }
    });

    const totalArticles = details.reduce((sum, s) => sum + s.articleCount, 0);
    const errorCount = details.filter((s) => !s.success).length;

    // Create a fetch log entry for manual fetch
    await createFetchLog(enabledSources.length, totalArticles, errorCount, details);

    return {
      success: true,
      totalArticles,
      errorCount,
      details,
    };
  } catch (error) {
    logger.error("manualFetchAll failed", { error });
    throw new HttpsError("internal", "Failed to fetch all sources");
  }
});

// ============================================================================
// FETCH LOG FUNCTIONS
// ============================================================================

/**
 * Gets recent fetch logs
 */
export const getFetchLogs = onCall(async (request) => {
  requireAuth(request);

  try {
    const { limit } = request.data || {};
    const logs = await getRecentFetchLogs(limit || 10);
    return { success: true, logs };
  } catch (error) {
    logger.error("getFetchLogs failed", { error });
    throw new HttpsError("internal", "Failed to get fetch logs");
  }
});

// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================

// ============================================================================
// TEXT EXTRACTION & SUMMARIZATION TESTING
// ============================================================================

/**
 * Tests text extraction and summarization on a single article
 * For admin testing purposes
 */
export const testTextExtraction = onCall(async (request) => {
  requireAuth(request);

  try {
    const { url, articleId } = request.data;

    if (!url && !articleId) {
      throw new HttpsError("invalid-argument", "Must provide url or articleId");
    }

    // Import extraction modules
    const { extractArticleText, validateExtractedText } = await import("./scrapers/textExtractor.js");
    const { createShortSummary } = await import("./summarizers/extractive.js");

    let testUrl = url;

    // If articleId provided, fetch URL from Firestore
    if (articleId && !url) {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore();
      const articleDoc = await db.collection("articles").doc(articleId).get();
      
      if (!articleDoc.exists) {
        throw new HttpsError("not-found", "Article not found");
      }
      
      testUrl = articleDoc.data()?.url;
    }

    if (!testUrl) {
      throw new HttpsError("invalid-argument", "No URL found");
    }

    logger.info(`Testing text extraction for: ${testUrl}`);

    // Extract text
    const textResult = await extractArticleText(testUrl);

    if (!textResult.success) {
      return {
        success: false,
        error: textResult.error,
      };
    }

    // Validate extraction
    const isValid = validateExtractedText(textResult);

    if (!isValid) {
      return {
        success: false,
        error: "Extracted text did not pass validation (too short or too few paragraphs)",
        fullText: textResult.fullText,
        wordCount: textResult.wordCount,
        paragraphs: textResult.paragraphs.length,
      };
    }

    // Generate summary
    const summaryResult = createShortSummary(textResult.fullText);

    return {
      success: true,
      fullText: textResult.fullText,
      extractedSummary: summaryResult.success ? summaryResult.summary : null,
      wordCount: textResult.wordCount,
      paragraphs: textResult.paragraphs.length,
      method: "extractive",
      error: null,
    };
  } catch (error) {
    logger.error("testTextExtraction failed", { error });
    throw new HttpsError("internal", "Failed to test text extraction");
  }
});

// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================

// Export the scheduled fetch job (runs every 12 hours)
export { scheduledFetch } from "./scheduled/fetchJob.js";

// Export the scheduled cleanup job (runs daily at 2 AM)
export { scheduledCleanup } from "./scheduled/cleanupJob.js";
