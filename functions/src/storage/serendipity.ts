import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import type { Article } from "../types/index.js";

const db = getFirestore();
const articlesCollection = db.collection("articles");

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets articles from the last 3 days with even distribution across sources
 *
 * Algorithm:
 * 1. Fetch all articles from last 3 days
 * 2. Group by source
 * 3. Calculate articles per source (total needed / number of sources)
 * 4. Take equally from each source
 * 5. If a source has fewer articles, pull randomly from other sources
 * 6. Randomize the final order
 *
 * @param totalArticles - Total number of articles to return
 * @returns Array of randomized articles evenly distributed across sources
 */
export async function getSerendipityArticles(
  totalArticles: number
): Promise<Article[]> {
  try {
    // Calculate cutoff date (3 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const cutoffTimestamp = Timestamp.fromDate(threeDaysAgo);

    logger.info("Fetching serendipity articles", {
      totalArticles,
      cutoffDate: threeDaysAgo.toISOString(),
    });

    // Fetch all articles from last 3 days
    const snapshot = await articlesCollection
      .where("fetchedAt", ">=", cutoffTimestamp)
      .orderBy("fetchedAt", "desc")
      .get();

    if (snapshot.empty) {
      logger.warn("No articles found in last 3 days");
      return [];
    }

    // Convert to Article objects
    const allArticles: Article[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];

    logger.info(`Found ${allArticles.length} articles from last 3 days`);

    // Group articles by source
    const articlesBySource = new Map<string, Article[]>();

    for (const article of allArticles) {
      const sourceId = article.sourceId;
      if (!articlesBySource.has(sourceId)) {
        articlesBySource.set(sourceId, []);
      }
      articlesBySource.get(sourceId)!.push(article);
    }

    const sourceCount = articlesBySource.size;
    logger.info(`Articles grouped into ${sourceCount} sources`);

    // If we don't have enough articles total, return what we have (randomized)
    if (allArticles.length <= totalArticles) {
      logger.info("Fewer articles than requested, returning all randomized");
      return shuffleArray(allArticles);
    }

    // Calculate articles per source for even distribution
    const articlesPerSource = Math.floor(totalArticles / sourceCount);
    const remainder = totalArticles % sourceCount;

    logger.info(`Distribution: ${articlesPerSource} per source, ${remainder} remainder`);

    // Collect articles evenly from each source
    const selectedArticles: Article[] = [];
    const leftoverArticles: Article[] = [];

    let sourcesProcessed = 0;
    for (const [sourceId, articles] of articlesBySource) {
      // Randomize articles from this source first
      const randomizedSourceArticles = shuffleArray(articles);

      // Determine how many to take from this source
      let toTake = articlesPerSource;

      // Distribute remainder articles to first few sources
      if (sourcesProcessed < remainder) {
        toTake += 1;
      }

      // Take what we can from this source
      const taken = randomizedSourceArticles.slice(0, toTake);
      selectedArticles.push(...taken);

      // If this source had fewer articles than needed, add the rest to leftover pool
      if (taken.length < toTake) {
        const shortage = toTake - taken.length;
        logger.info(`Source ${sourceId} only had ${taken.length}/${toTake} articles, ${shortage} short`);

        // Add remaining articles from other sources to leftover pool
        for (const [otherSourceId, otherArticles] of articlesBySource) {
          if (otherSourceId !== sourceId) {
            leftoverArticles.push(...otherArticles);
          }
        }
      }

      sourcesProcessed++;
    }

    // Fill any gaps from leftover articles
    const needed = totalArticles - selectedArticles.length;
    if (needed > 0 && leftoverArticles.length > 0) {
      logger.info(`Filling ${needed} gaps from ${leftoverArticles.length} leftover articles`);

      // Remove duplicates (articles already selected)
      const selectedIds = new Set(selectedArticles.map(a => a.id));
      const availableLeftovers = leftoverArticles.filter(a => !selectedIds.has(a.id));

      // Randomly select from leftovers
      const randomLeftovers = shuffleArray(availableLeftovers).slice(0, needed);
      selectedArticles.push(...randomLeftovers);
    }

    // Final randomization of the entire result set
    const finalArticles = shuffleArray(selectedArticles).slice(0, totalArticles);

    logger.info(`Returning ${finalArticles.length} serendipity articles`);

    // Log distribution summary
    const finalDistribution = new Map<string, number>();
    for (const article of finalArticles) {
      const count = finalDistribution.get(article.sourceId) || 0;
      finalDistribution.set(article.sourceId, count + 1);
    }

    logger.info("Final distribution by source:", Object.fromEntries(finalDistribution));

    return finalArticles;
  } catch (error) {
    logger.error("Failed to get serendipity articles", { error });
    throw error;
  }
}
