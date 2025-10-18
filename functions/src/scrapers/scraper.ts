import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "firebase-functions/v2";
import type { Source, FetchResult, RawArticle } from "../types/index.js";

/**
 * Scrapes articles from a website using CSS selectors
 * @param source - The news source configuration with selectors
 * @returns FetchResult containing success status, articles array, and any error
 */
export async function fetchScrape(source: Source): Promise<FetchResult> {
  try {
    if (!source.selectors) {
      throw new Error("No selectors configured for scraping");
    }

    logger.info(`Scraping articles from ${source.name}`, { url: source.url });

    const response = await axios.get(source.url, {
      timeout: 10000,
      headers: { "User-Agent": "Tribune News Aggregator/1.0" },
    });

    const $ = cheerio.load(response.data);
    const articles: RawArticle[] = [];

    $(source.selectors.articleContainer).each((_, element) => {
      const title = $(element).find(source.selectors!.headline).text().trim();
      let link = $(element).find(source.selectors!.link).attr("href");

      // Handle optional fields
      const summary = source.selectors!.summary
        ? $(element).find(source.selectors!.summary).text().trim()
        : "";

      const image = source.selectors!.image
        ? $(element).find(source.selectors!.image).attr("src")
        : "";

      const date = source.selectors!.date
        ? $(element).find(source.selectors!.date).text().trim()
        : "";

      // Only add if we have both title and link
      if (title && link) {
        // Resolve relative URLs
        if (link && !link.startsWith("http")) {
          const baseUrl = new URL(source.url);
          link = new URL(link, baseUrl.origin).href;
        }

        articles.push({
          title,
          url: link,
          summary,
          image,
          pubDate: date || undefined,
        });
      }
    });

    logger.info(`Successfully scraped ${articles.length} articles from ${source.name}`);

    return { success: true, articles, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Scrape failed for ${source.name}`, {
      error: errorMessage,
      url: source.url,
    });

    return {
      success: false,
      articles: [],
      error: `Scrape failed: ${errorMessage}`,
    };
  }
}
