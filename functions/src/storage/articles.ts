import { getFirestore, Timestamp, WriteBatch } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import type { Article, NormalizedArticle } from "../types/index.js";
import { hashUrl } from "../scrapers/normalize.js";

const db = getFirestore();
const articlesCollection = db.collection("articles");

/**
 * Converts a NormalizedArticle to a Firestore Article document
 */
function toFirestoreArticle(normalized: NormalizedArticle): Omit<Article, "id"> {
  return {
    title: normalized.title,
    url: normalized.url,
    sourceId: normalized.sourceId,
    sourceName: normalized.sourceName,
    summary: normalized.summary,
    author: normalized.author,
    publishedDate: normalized.publishedDate
      ? Timestamp.fromDate(normalized.publishedDate)
      : null,
    imageUrl: normalized.imageUrl,
    fetchedAt: Timestamp.fromDate(normalized.fetchedAt),
    read: false,
    bookmarked: false,
    hidden: false,
  };
}

/**
 * Saves a single article with deduplication (using URL hash as ID)
 * @returns true if article was new, false if it already existed
 */
export async function saveArticle(article: NormalizedArticle): Promise<boolean> {
  try {
    const articleId = hashUrl(article.url);
    const docRef = articlesCollection.doc(articleId);

    // Check if article already exists
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
      logger.debug(`Article already exists: ${article.title}`);
      return false; // Not new
    }

    // Save new article
    const firestoreArticle = toFirestoreArticle(article);
    await docRef.set(firestoreArticle);

    logger.debug(`Saved new article: ${article.title}`);
    return true; // New article
  } catch (error) {
    logger.error("Failed to save article", { url: article.url, error });
    throw error;
  }
}

/**
 * Saves multiple articles in a batch with deduplication
 * @returns count of new articles saved
 */
export async function saveArticleBatch(
  articles: NormalizedArticle[]
): Promise<number> {
  if (articles.length === 0) {
    return 0;
  }

  try {
    // Check which articles already exist
    const articleIds = articles.map((article) => hashUrl(article.url));
    const existingDocs = await db.getAll(
      ...articleIds.map((id) => articlesCollection.doc(id))
    );

    const existingIds = new Set(
      existingDocs.filter((doc) => doc.exists).map((doc) => doc.id)
    );

    // Filter out existing articles
    const newArticles = articles.filter(
      (article) => !existingIds.has(hashUrl(article.url))
    );

    if (newArticles.length === 0) {
      logger.info("No new articles to save (all duplicates)");
      return 0;
    }

    // Batch write new articles (max 500 per batch)
    const batches: WriteBatch[] = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const article of newArticles) {
      const articleId = hashUrl(article.url);
      const docRef = articlesCollection.doc(articleId);
      const firestoreArticle = toFirestoreArticle(article);

      currentBatch.set(docRef, firestoreArticle);
      batchCount++;

      // Firestore batch limit is 500 operations
      if (batchCount === 500) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        batchCount = 0;
      }
    }

    // Add remaining batch
    if (batchCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    await Promise.all(batches.map((batch) => batch.commit()));

    logger.info(`Saved ${newArticles.length} new articles`);
    return newArticles.length;
  } catch (error) {
    logger.error("Failed to save article batch", { error });
    throw error;
  }
}

/**
 * Retrieves articles by source ID
 */
export async function getArticlesBySource(
  sourceId: string,
  limit = 50
): Promise<Article[]> {
  try {
    const snapshot = await articlesCollection
      .where("sourceId", "==", sourceId)
      .orderBy("fetchedAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];
  } catch (error) {
    logger.error("Failed to get articles by source", { sourceId, error });
    throw error;
  }
}

// getArticlesByCategory removed in Sprint 8 - categories system removed

/**
 * Retrieves recent articles
 */
export async function getRecentArticles(limit = 50): Promise<Article[]> {
  try {
    const snapshot = await articlesCollection
      .orderBy("fetchedAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];
  } catch (error) {
    logger.error("Failed to get recent articles", { error });
    throw error;
  }
}

/**
 * Deletes articles older than specified days
 */
export async function deleteOldArticles(daysToKeep: number): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const snapshot = await articlesCollection
      .where("fetchedAt", "<", cutoffTimestamp)
      .get();

    if (snapshot.empty) {
      logger.info("No old articles to delete");
      return 0;
    }

    // Delete in batches
    const batches: WriteBatch[] = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    snapshot.docs.forEach((doc) => {
      currentBatch.delete(doc.ref);
      batchCount++;

      if (batchCount === 500) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        batchCount = 0;
      }
    });

    if (batchCount > 0) {
      batches.push(currentBatch);
    }

    await Promise.all(batches.map((batch) => batch.commit()));

    logger.info(`Deleted ${snapshot.size} old articles`);
    return snapshot.size;
  } catch (error) {
    logger.error("Failed to delete old articles", { error });
    throw error;
  }
}

// updateArticleCategories removed in Sprint 8 - categories system removed
