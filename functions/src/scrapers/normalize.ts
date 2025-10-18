import { parseISO, isValid } from "date-fns";
import { createHash } from "crypto";
import type { RawArticle, NormalizedArticle, Source } from "../types/index.js";

/**
 * Cleans and trims text content, removing extra whitespace
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n+/g, " ") // Replace newlines with space
    .trim();
}

/**
 * Cleans article title, removing common prefixes/suffixes
 */
function cleanTitle(title: string): string {
  let cleaned = cleanText(title);

  // Remove common RSS feed suffixes
  cleaned = cleaned.replace(/\s*-\s*RSS$/i, "");

  return cleaned;
}

/**
 * Resolves a potentially relative URL to an absolute URL
 */
function resolveUrl(url: string, baseUrl: string): string {
  if (!url) return "";

  // Already absolute URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  try {
    const base = new URL(baseUrl);
    return new URL(url, base.origin).href;
  } catch {
    return url; // Return as-is if URL resolution fails
  }
}

/**
 * Parses various date formats to a Date object
 */
function parseDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;

  try {
    // Try parsing as ISO date first
    const date = parseISO(dateString);
    if (isValid(date)) {
      return date;
    }

    // Try parsing as standard Date string
    const fallbackDate = new Date(dateString);
    if (isValid(fallbackDate)) {
      return fallbackDate;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generates a consistent hash from a URL for use as document ID
 */
export function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

/**
 * Normalizes a raw article from a fetcher into a consistent format
 * @param rawArticle - The raw article data from RSS or scraper
 * @param source - The source configuration
 * @returns NormalizedArticle with consistent field names and cleaned data
 */
export function normalizeArticle(
  rawArticle: RawArticle,
  source: Source
): NormalizedArticle | null {
  // Extract title (try multiple field names)
  const rawTitle = rawArticle.title || rawArticle.headline;
  if (!rawTitle) {
    return null; // Title is required
  }

  // Extract URL (try multiple field names)
  const rawUrl = rawArticle.link || rawArticle.url;
  if (!rawUrl) {
    return null; // URL is required
  }

  const title = cleanTitle(rawTitle);
  const url = resolveUrl(rawUrl, source.url);

  // Validate that we have the minimum required fields
  if (!title || !url) {
    return null;
  }

  return {
    title,
    url,
    sourceId: source.id,
    sourceName: source.name,
    summary: cleanText(rawArticle.summary || rawArticle.description || ""),
    author: cleanText(rawArticle.author || ""),
    publishedDate: parseDate(rawArticle.pubDate || rawArticle.published),
    imageUrl: resolveUrl(rawArticle.image || rawArticle.thumbnail || "", source.url),
    fetchedAt: new Date(),
  };
}
