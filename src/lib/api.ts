import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { Source, Article, Category } from "@/types";

// ============================================================================
// SOURCE FUNCTIONS
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

export async function getArticles(limit = 50): Promise<{ success: boolean; articles: Article[] }> {
  const fn = httpsCallable(functions, "getArticles");
  const result = await fn({ limit });
  return result.data as any;
}

export async function getSourceArticles(sourceId: string, limit = 50): Promise<{ success: boolean; articles: Article[] }> {
  const fn = httpsCallable(functions, "getSourceArticles");
  const result = await fn({ sourceId, limit });
  return result.data as any;
}

export async function getCategoryArticles(categoryId: string, limit = 50): Promise<{ success: boolean; articles: Article[] }> {
  const fn = httpsCallable(functions, "getCategoryArticles");
  const result = await fn({ categoryId, limit });
  return result.data as any;
}

export async function cleanupOldArticles(daysToKeep = 30) {
  const fn = httpsCallable(functions, "cleanupOldArticles");
  const result = await fn({ daysToKeep });
  return result.data;
}

// ============================================================================
// CATEGORY FUNCTIONS
// ============================================================================

export async function createCategory(categoryData: any) {
  const fn = httpsCallable(functions, "createCategory");
  const result = await fn(categoryData);
  return result.data;
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const fn = httpsCallable(functions, "modifyCategory");
  const result = await fn({ id, updates });
  return result.data;
}

export async function deleteCategory(id: string) {
  const fn = httpsCallable(functions, "removeCategory");
  const result = await fn({ id });
  return result.data;
}

export async function getCategories(): Promise<{ success: boolean; categories: Category[] }> {
  const fn = httpsCallable(functions, "getCategories");
  const result = await fn({});
  return result.data as any;
}
