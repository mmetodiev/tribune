import { logger } from "firebase-functions/v2";
import type { NormalizedArticle, Category } from "../types/index.js";
import { getAllCategories, getOrCreateUncategorized } from "../storage/categories.js";

/**
 * Categorizes an article based on rule-based matching
 * @param article - The normalized article to categorize
 * @param categories - Optional pre-loaded categories (to avoid repeated fetches)
 * @returns Array of category IDs that match the article
 */
export async function categorizeArticle(
  article: NormalizedArticle,
  categories?: Category[]
): Promise<string[]> {
  try {
    // Load categories if not provided
    const allCategories = categories || (await getAllCategories());
    const matches: string[] = [];

    // Prepare article text for keyword matching
    const articleText = `${article.title} ${article.summary}`.toLowerCase();

    for (const category of allCategories) {
      // Skip the uncategorized category
      if (category.slug === "uncategorized") {
        continue;
      }

      let hasMatch = false;

      // Check keyword matches
      if (category.rules.keywords && category.rules.keywords.length > 0) {
        const hasKeyword = category.rules.keywords.some((keyword) =>
          articleText.includes(keyword.toLowerCase())
        );
        if (hasKeyword) {
          hasMatch = true;
        }
      }

      // Check source match
      if (category.rules.sources && category.rules.sources.length > 0) {
        const sourceMatch = category.rules.sources.includes(article.sourceId);
        if (sourceMatch) {
          hasMatch = true;
        }
      }

      // Check domain match
      if (category.rules.domains && category.rules.domains.length > 0) {
        try {
          const domain = new URL(article.url).hostname;
          const domainMatch = category.rules.domains.some((d) =>
            domain.includes(d)
          );
          if (domainMatch) {
            hasMatch = true;
          }
        } catch {
          // Invalid URL, skip domain check
        }
      }

      if (hasMatch) {
        matches.push(category.id);
      }
    }

    // If no matches, assign to uncategorized
    if (matches.length === 0) {
      const uncategorizedId = await getOrCreateUncategorized();
      return [uncategorizedId];
    }

    return matches;
  } catch (error) {
    logger.error("Failed to categorize article", { article: article.title, error });

    // On error, try to return uncategorized
    try {
      const uncategorizedId = await getOrCreateUncategorized();
      return [uncategorizedId];
    } catch {
      // If even that fails, return empty array
      return [];
    }
  }
}

/**
 * Categorizes multiple articles in batch
 * More efficient than categorizing one by one as it loads categories once
 */
export async function categorizeArticles(
  articles: NormalizedArticle[]
): Promise<Map<string, string[]>> {
  const categoriesMap = new Map<string, string[]>();

  try {
    // Load categories once for all articles
    const categories = await getAllCategories();

    // Categorize each article
    for (const article of articles) {
      const categoryIds = await categorizeArticle(article, categories);
      categoriesMap.set(article.url, categoryIds);
    }

    return categoriesMap;
  } catch (error) {
    logger.error("Failed to categorize articles batch", { error });
    return categoriesMap;
  }
}
