import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { Source, Article } from "@/types";

/**
 * Firebase Functions API
 * 
 * This module contains callable Firebase Functions for server-side operations.
 * 
 * ARCHITECTURE NOTES:
 * - READ operations (get*) are DEPRECATED - use hooks instead (useArticles, useSources, etc.)
 * - WRITE operations (create*, update*, delete*, test*, manual*) still use Functions
 * - Direct Firestore queries are faster and more cost-effective for reads
 * - Functions are retained for complex operations requiring server-side logic
 * 
 * Refactored in Sprint 7+ to use services + hooks pattern for better performance.
 */

// ============================================================================
// SOURCE FUNCTIONS (Mutations - Keep as Functions)
// ============================================================================

export async function createSource(sourceData: any) {
  const fn = httpsCallable(functions, "createSource");
  const result = await fn(sourceData);
  return result.data;
}

export async function updateSource(id: string, updates: Partial<Source>) {
  const fn = httpsCallable(functions, "modifySource");
  const result = await fn({ id, updates });
  return result.data;
}

export async function deleteSource(id: string) {
  const fn = httpsCallable(functions, "removeSource");
  const result = await fn({ id });
  return result.data;
}

export async function toggleSource(id: string) {
  const fn = httpsCallable(functions, "toggleSourceStatus");
  const result = await fn({ id });
  return result.data;
}

/**
 * @deprecated Use useSources() hook instead
 * Direct Firestore queries are faster and more cost-effective
 */
export async function getSources(): Promise<{ success: boolean; sources: Source[] }> {
  const fn = httpsCallable(functions, "getSources");
  const result = await fn({});
  return result.data as any;
}

export async function testSource(id: string) {
  const fn = httpsCallable(functions, "testSource");
  const result = await fn({ id });
  return result.data;
}

export async function manualFetchSource(id: string) {
  const fn = httpsCallable(functions, "manualFetchSource");
  const result = await fn({ id });
  return result.data;
}

export async function manualFetchAll() {
  const fn = httpsCallable(functions, "manualFetchAll");
  const result = await fn({});
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
