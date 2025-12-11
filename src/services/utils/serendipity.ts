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
 * Sorts articles deterministically by date (newest first), then by ID for consistency
 */
function sortArticlesDeterministically(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    // First, sort by publishedDate if available (newest first)
    const aDate = a.publishedDate?.toMillis() || a.fetchedAt?.toMillis() || 0;
    const bDate = b.publishedDate?.toMillis() || b.fetchedAt?.toMillis() || 0;
    
    if (bDate !== aDate) {
      return bDate - aDate; // Newest first
    }
    
    // If dates are equal, sort by ID for deterministic ordering
    return a.id.localeCompare(b.id);
  });
}

/**
 * Distributes articles evenly across sources deterministically (no randomization)
 * 
 * Algorithm:
 * 1. Group articles by source
 * 2. Sort articles within each source deterministically (by date, then ID)
 * 3. Calculate articles per source (total needed / number of sources)
 * 4. Take equally from each source in a round-robin fashion
 * 5. If a source has fewer articles, fill gaps from other sources deterministically
 * 
 * @param articles - Array of articles to distribute
 * @param totalNeeded - Total number of articles needed
 * @returns Deterministically sorted array of articles evenly distributed across sources
 */
export function distributeArticlesEvenly(
  articles: Article[],
  totalNeeded: number
): Article[] {
  // If we don't have enough articles, return all sorted deterministically
  if (articles.length <= totalNeeded) {
    return sortArticlesDeterministically(articles);
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

  // Sort articles within each source deterministically
  const sortedSources = new Map<string, Article[]>();
  for (const [sourceId, sourceArticles] of articlesBySource) {
    sortedSources.set(sourceId, sortArticlesDeterministically(sourceArticles));
  }

  // Calculate articles per source for even distribution
  const articlesPerSource = Math.floor(totalNeeded / sourceCount);
  const remainder = totalNeeded % sourceCount;

  console.log('[Serendipity] Distributing articles deterministically:', {
    totalArticles: articles.length,
    sources: sourceCount,
    needed: totalNeeded,
    perSource: articlesPerSource,
    remainder,
  });

  // Collect articles evenly from each source using round-robin
  const selectedArticles: Article[] = [];
  const sourceIndices = new Map<string, number>(); // Track current index for each source
  const sourceArrays = Array.from(sortedSources.entries());

  // Initialize indices
  for (const [sourceId] of sourceArrays) {
    sourceIndices.set(sourceId, 0);
  }

  // Round-robin selection: take articles from each source in turn
  let totalSelected = 0;
  let round = 0;

  while (totalSelected < totalNeeded) {
    let selectedInRound = false;

    for (let i = 0; i < sourceArrays.length && totalSelected < totalNeeded; i++) {
      const [sourceId, sourceArticles] = sourceArrays[i];
      const currentIndex = sourceIndices.get(sourceId)!;
      
      // Determine how many to take from this source in this round
      let toTake = articlesPerSource;
      if (round === 0 && i < remainder) {
        toTake += 1; // First round: distribute remainder to first few sources
      } else if (round > 0) {
        toTake = 1; // Subsequent rounds: take 1 from each source
      }

      // Take articles from this source
      const available = sourceArticles.length - currentIndex;
      const takeCount = Math.min(toTake, available, totalNeeded - totalSelected);
      
      if (takeCount > 0) {
        const taken = sourceArticles.slice(currentIndex, currentIndex + takeCount);
        selectedArticles.push(...taken);
        sourceIndices.set(sourceId, currentIndex + takeCount);
        totalSelected += takeCount;
        selectedInRound = true;
      }
    }

    // If no articles were selected in this round, break to avoid infinite loop
    if (!selectedInRound) {
      break;
    }

    round++;
  }

  // Sort the final result deterministically to ensure consistent ordering
  const finalArticles = sortArticlesDeterministically(selectedArticles).slice(0, totalNeeded);

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

