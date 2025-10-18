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
  getArticlesByCategory,
  getRecentArticles,
  deleteOldArticles,
} from "./storage/articles.js";

import {
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  type CreateCategoryData,
} from "./storage/categories.js";

import { fetchSource, fetchAndStoreArticles } from "./core/fetchSource.js";
import type { Source } from "./types/index.js";

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
    const sourceId = await addSource(sourceData);
    return { success: true, sourceId };
  } catch (error) {
    logger.error("createSource failed", { error });
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

/**
 * Gets articles by category
 */
export const getCategoryArticles = onCall(async (request) => {
  requireAuth(request);

  try {
    const { categoryId, limit } = request.data;
    const articles = await getArticlesByCategory(categoryId, limit);
    return { success: true, articles };
  } catch (error) {
    logger.error("getCategoryArticles failed", { error });
    throw new HttpsError("internal", "Failed to get articles");
  }
});

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
// CATEGORY FUNCTIONS
// ============================================================================

/**
 * Creates a new category
 */
export const createCategory = onCall(async (request) => {
  requireAuth(request);

  try {
    const categoryData = request.data as CreateCategoryData;
    const categoryId = await addCategory(categoryData);
    return { success: true, categoryId };
  } catch (error) {
    logger.error("createCategory failed", { error });
    throw new HttpsError("internal", "Failed to create category");
  }
});

/**
 * Updates an existing category
 */
export const modifyCategory = onCall(async (request) => {
  requireAuth(request);

  try {
    const { id, updates } = request.data;
    await updateCategory(id, updates);
    return { success: true };
  } catch (error) {
    logger.error("modifyCategory failed", { error });
    throw new HttpsError("internal", "Failed to update category");
  }
});

/**
 * Deletes a category
 */
export const removeCategory = onCall(async (request) => {
  requireAuth(request);

  try {
    const { id } = request.data;
    await deleteCategory(id);
    return { success: true };
  } catch (error) {
    logger.error("removeCategory failed", { error });
    throw new HttpsError("internal", "Failed to delete category");
  }
});

/**
 * Gets all categories
 */
export const getCategories = onCall(async (request) => {
  requireAuth(request);

  try {
    const categories = await getAllCategories();
    return { success: true, categories };
  } catch (error) {
    logger.error("getCategories failed", { error });
    throw new HttpsError("internal", "Failed to get categories");
  }
});

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

    const summary = results.map((result, index) => {
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

    const totalArticles = summary.reduce((sum, s) => sum + s.articleCount, 0);
    const errorCount = summary.filter((s) => !s.success).length;

    return {
      success: true,
      totalArticles,
      errorCount,
      details: summary,
    };
  } catch (error) {
    logger.error("manualFetchAll failed", { error });
    throw new HttpsError("internal", "Failed to fetch all sources");
  }
});
