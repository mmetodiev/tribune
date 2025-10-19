import type { Article } from '@/types';

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
 * Distributes articles evenly across sources with randomization
 * 
 * Algorithm:
 * 1. Group articles by source
 * 2. Calculate articles per source (total needed / number of sources)
 * 3. Take equally from each source (randomized within each source)
 * 4. If a source has fewer articles, pull randomly from other sources
 * 5. Final randomization of the entire result set
 * 
 * @param articles - Array of articles to distribute
 * @param totalNeeded - Total number of articles needed
 * @returns Randomized array of articles evenly distributed across sources
 */
export function distributeArticlesEvenly(
  articles: Article[],
  totalNeeded: number
): Article[] {
  // If we don't have enough articles, return all randomized
  if (articles.length <= totalNeeded) {
    return shuffleArray(articles);
  }

  // Group articles by source
  const articlesBySource = new Map<string, Article[]>();

  for (const article of articles) {
    const sourceId = article.sourceId;
    if (!articlesBySource.has(sourceId)) {
      articlesBySource.set(sourceId, []);
    }
    articlesBySource.get(sourceId)!.push(article);
  }

  const sourceCount = articlesBySource.size;
  
  if (sourceCount === 0) {
    return [];
  }

  // Calculate articles per source for even distribution
  const articlesPerSource = Math.floor(totalNeeded / sourceCount);
  const remainder = totalNeeded % sourceCount;

  console.log('[Serendipity] Distributing articles:', {
    totalArticles: articles.length,
    sources: sourceCount,
    needed: totalNeeded,
    perSource: articlesPerSource,
    remainder,
  });

  // Collect articles evenly from each source
  const selectedArticles: Article[] = [];
  const leftoverArticles: Article[] = [];

  let sourcesProcessed = 0;
  for (const [sourceId, sourceArticles] of articlesBySource) {
    // Randomize articles from this source first
    const randomizedSourceArticles = shuffleArray(sourceArticles);

    // Determine how many to take from this source
    let toTake = articlesPerSource;

    // Distribute remainder articles to first few sources
    if (sourcesProcessed < remainder) {
      toTake += 1;
    }

    // Take what we can from this source
    const taken = randomizedSourceArticles.slice(0, toTake);
    selectedArticles.push(...taken);

    // If this source had fewer articles than needed, save shortage info
    if (taken.length < toTake) {
      console.log(`[Serendipity] Source ${sourceId} only had ${taken.length}/${toTake} articles`);
    }

    // Add remaining articles from this source to leftover pool
    const remaining = randomizedSourceArticles.slice(toTake);
    leftoverArticles.push(...remaining);

    sourcesProcessed++;
  }

  // Fill any gaps from leftover articles
  const needed = totalNeeded - selectedArticles.length;
  if (needed > 0 && leftoverArticles.length > 0) {
    console.log(`[Serendipity] Filling ${needed} gaps from ${leftoverArticles.length} leftover articles`);

    // Remove duplicates (articles already selected)
    const selectedIds = new Set(selectedArticles.map(a => a.id));
    const availableLeftovers = leftoverArticles.filter(a => !selectedIds.has(a.id));

    // Randomly select from leftovers
    const randomLeftovers = shuffleArray(availableLeftovers).slice(0, needed);
    selectedArticles.push(...randomLeftovers);
  }

  // Final randomization of the entire result set
  const finalArticles = shuffleArray(selectedArticles).slice(0, totalNeeded);

  // Log distribution summary
  const finalDistribution = new Map<string, number>();
  for (const article of finalArticles) {
    const count = finalDistribution.get(article.sourceId) || 0;
    finalDistribution.set(article.sourceId, count + 1);
  }

  console.log('[Serendipity] Final distribution by source:', Object.fromEntries(finalDistribution));

  return finalArticles;
}

/**
 * Gets a random sample of articles
 * Simple random selection without source distribution logic
 * 
 * @param articles - Array of articles to sample from
 * @param count - Number of articles to return
 * @returns Randomized array of articles
 */
export function getRandomArticles(articles: Article[], count: number): Article[] {
  if (articles.length <= count) {
    return shuffleArray(articles);
  }

  return shuffleArray(articles).slice(0, count);
}

