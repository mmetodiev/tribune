import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { Source, Article } from "@/types";

/**
 * Firebase Functions API
 * 
 * This module contains callable Firebase Functions for backend operations only.
 * 
 * ARCHITECTURE NOTES:
 * - Source CRUD operations now use direct Firestore (see services/sourcesService.ts)
 * - Only backend operations (RSS fetching) use Functions
 * - Direct Firestore queries are faster and more cost-effective for reads/writes
 */

// ============================================================================
// RSS FETCHING FUNCTIONS (Backend operations only)
// ============================================================================

/**
 * Manually fetch articles from a specific RSS source
 * @param id Source ID
 */
export async function manualFetchSource(id: string) {
  const fn = httpsCallable(functions, "manualFetchSource");
  const result = await fn({ id });
  return result.data;
}

/**
 * Manually fetch articles from all enabled RSS sources
 */
export async function manualFetchAll() {
  const fn = httpsCallable(functions, "manualFetchAll");
  const result = await fn({});
  return result.data;
}

/**
 * Test an RSS feed URL (for validation before adding)
 * @param url RSS feed URL to test
 */
export async function testRSSFeed(url: string) {
  const fn = httpsCallable(functions, "testRSSFeed");
  const result = await fn({ url });
  return result.data;
}

// ============================================================================
// ARTICLE FUNCTIONS
// ============================================================================

/**
 * @deprecated Use useArticles() hook instead
 * Direct Firestore queries are faster and more cost-effective
 */
export async function getArticles(limit = 50): Promise<{ success: boolean; articles: Article[] }> {
  const fn = httpsCallable(functions, "getArticles");
  const result = await fn({ limit });
  return result.data as any;
}

/**
 * @deprecated Use useSerendipityArticles() hook instead
 * Direct Firestore queries are faster and more cost-effective
 */
export async function getSerendipityArticles(totalArticles = 20): Promise<{ success: boolean; articles: Article[] }> {
  const fn = httpsCallable(functions, "getSerendipityArticles");
  const result = await fn({ totalArticles });
  return result.data as any;
}

/**
 * @deprecated Use useSourceArticles() hook instead
 * Direct Firestore queries are faster and more cost-effective
 */
export async function getSourceArticles(sourceId: string, limit = 50): Promise<{ success: boolean; articles: Article[] }> {
  const fn = httpsCallable(functions, "getSourceArticles");
  const result = await fn({ sourceId, limit });
  return result.data as any;
}

/**
 * Cleanup old articles (batch operation, keeps using function)
 */
export async function cleanupOldArticles(daysToKeep = 30) {
  const fn = httpsCallable(functions, "cleanupOldArticles");
  const result = await fn({ daysToKeep });
  return result.data;
}

// ============================================================================
// CATEGORY FUNCTIONS - REMOVED IN SPRINT 8
// ============================================================================
// Categories system removed to focus on serendipity and random article distribution

// ============================================================================
// FETCH LOG FUNCTIONS
// ============================================================================

/**
 * @deprecated Use useFetchLogs() hook instead
 * Direct Firestore queries are faster and more cost-effective
 */
export async function getFetchLogs(limit = 10) {
  const fn = httpsCallable(functions, "getFetchLogs");
  const result = await fn({ limit });
  return result.data;
}
