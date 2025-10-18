import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import type { Source, SourceType, UpdateFrequency } from "../types/index.js";

const db = getFirestore();
const sourcesCollection = db.collection("sources");

/**
 * Interface for creating a new source (without auto-generated fields)
 */
export interface CreateSourceData {
  name: string;
  url: string;
  type: SourceType;
  enabled?: boolean;
  selectors?: Source["selectors"];
  category?: string;
  updateFrequency?: UpdateFrequency;
  priority?: number;
  robotsTxtCompliant?: boolean;
  termsAccepted?: boolean;
  notes?: string;
}

/**
 * Creates a new news source
 */
export async function addSource(sourceData: CreateSourceData): Promise<string> {
  try {
    const newSource: Omit<Source, "id"> = {
      name: sourceData.name,
      url: sourceData.url,
      type: sourceData.type,
      enabled: sourceData.enabled ?? true,
      selectors: sourceData.selectors,
      category: sourceData.category || "general",
      updateFrequency: sourceData.updateFrequency || "daily",
      priority: sourceData.priority || 5,
      lastFetchedAt: null,
      lastSuccessAt: null,
      consecutiveFailures: 0,
      status: "active",
      errorMessage: "",
      totalArticlesFetched: 0,
      averageArticlesPerFetch: 0,
      robotsTxtCompliant: sourceData.robotsTxtCompliant ?? true,
      termsAccepted: sourceData.termsAccepted ?? true,
      notes: sourceData.notes || "",
    };

    const docRef = await sourcesCollection.add(newSource);
    logger.info(`Created new source: ${sourceData.name}`, { id: docRef.id });

    return docRef.id;
  } catch (error) {
    logger.error("Failed to create source", { error });
    throw error;
  }
}

/**
 * Updates an existing source
 */
export async function updateSource(
  id: string,
  updates: Partial<Source>
): Promise<void> {
  try {
    await sourcesCollection.doc(id).update(updates);
    logger.info(`Updated source: ${id}`);
  } catch (error) {
    logger.error("Failed to update source", { id, error });
    throw error;
  }
}

/**
 * Deletes a source
 */
export async function deleteSource(id: string): Promise<void> {
  try {
    await sourcesCollection.doc(id).delete();
    logger.info(`Deleted source: ${id}`);
  } catch (error) {
    logger.error("Failed to delete source", { id, error });
    throw error;
  }
}

/**
 * Toggles a source's enabled status
 */
export async function toggleSource(id: string): Promise<void> {
  try {
    const doc = await sourcesCollection.doc(id).get();
    if (!doc.exists) {
      throw new Error(`Source not found: ${id}`);
    }

    const source = doc.data() as Source;
    await sourcesCollection.doc(id).update({ enabled: !source.enabled });
    logger.info(`Toggled source: ${id}`, { enabled: !source.enabled });
  } catch (error) {
    logger.error("Failed to toggle source", { id, error });
    throw error;
  }
}

/**
 * Retrieves a single source by ID
 */
export async function getSource(id: string): Promise<Source | null> {
  try {
    const doc = await sourcesCollection.doc(id).get();
    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() } as Source;
  } catch (error) {
    logger.error("Failed to get source", { id, error });
    throw error;
  }
}

/**
 * Retrieves all enabled sources
 */
export async function getEnabledSources(): Promise<Source[]> {
  try {
    const snapshot = await sourcesCollection.where("enabled", "==", true).get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Source[];
  } catch (error) {
    logger.error("Failed to get enabled sources", { error });
    throw error;
  }
}

/**
 * Retrieves all sources
 */
export async function getAllSources(): Promise<Source[]> {
  try {
    const snapshot = await sourcesCollection.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Source[];
  } catch (error) {
    logger.error("Failed to get all sources", { error });
    throw error;
  }
}

/**
 * Updates source statistics after a fetch
 */
export async function updateSourceStats(
  sourceId: string,
  success: boolean,
  articleCount: number,
  error: string | null
): Promise<void> {
  try {
    const source = await getSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    const now = Timestamp.now();
    const updates: Partial<Source> = {
      lastFetchedAt: now,
    };

    if (success) {
      // Update success stats
      updates.lastSuccessAt = now;
      updates.consecutiveFailures = 0;
      updates.status = "active";
      updates.errorMessage = "";
      updates.totalArticlesFetched = source.totalArticlesFetched + articleCount;

      // Calculate average (simple moving average)
      const totalFetches = source.lastSuccessAt ? source.totalArticlesFetched / source.averageArticlesPerFetch || 1 : 1;
      updates.averageArticlesPerFetch =
        (source.averageArticlesPerFetch * totalFetches + articleCount) / (totalFetches + 1);
    } else {
      // Update failure stats
      updates.consecutiveFailures = source.consecutiveFailures + 1;
      updates.errorMessage = error || "Unknown error";

      // Auto-disable after 5 consecutive failures
      if (updates.consecutiveFailures >= 5) {
        updates.status = "error";
      }
    }

    await updateSource(sourceId, updates);
  } catch (error) {
    logger.error("Failed to update source stats", { sourceId, error });
    throw error;
  }
}
