import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "firebase-functions/v2";

/**
 * Text Extraction Module
 * 
 * Fetches full article HTML and extracts main content text.
 * Designed to be modular and replaceable with more sophisticated methods.
 */

export interface TextExtractionResult {
  success: boolean;
  fullText: string;
  paragraphs: string[];
  wordCount: number;
  error: string | null;
}

/**
 * Extracts main article text from a URL
 * 
 * Strategy:
 * 1. Fetch article HTML
 * 2. Remove noise (scripts, styles, nav, ads)
 * 3. Extract paragraphs from main content
 * 4. Clean and normalize text
 * 
 * @param url - Article URL to extract text from
 * @returns TextExtractionResult with full text and metadata
 */
export async function extractArticleText(url: string): Promise<TextExtractionResult> {
  try {
    logger.info(`Extracting text from: ${url}`);

    // Fetch article HTML
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TribuneBot/1.0; +https://tribune.news/bot)",
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    // Remove noise elements
    $("script, style, nav, header, footer, aside, iframe, noscript").remove();
    $(".ad, .advertisement, .social-share, .comments").remove();
    $("[class*='ad-'], [class*='banner'], [id*='ad-']").remove();

    // Try to find main content container
    // Common article containers
    const contentSelectors = [
      "article",
      "[role='main']",
      "main",
      ".article-content",
      ".post-content",
      ".entry-content",
      ".story-body",
      "#article-body",
      ".article-body",
    ];

    let $content: any = $("body");
    for (const selector of contentSelectors) {
      const $candidate = $(selector);
      if ($candidate.length > 0) {
        $content = $candidate.first();
        break;
      }
    }

    // Extract paragraphs
    const paragraphs: string[] = [];
    $content.find("p").each((_: number, element: any) => {
      const text = $(element).text().trim();
      
      // Filter out short/junk paragraphs
      if (text.length > 50 && !isJunkParagraph(text)) {
        paragraphs.push(text);
      }
    });

    // If no paragraphs found, try extracting all text
    if (paragraphs.length === 0) {
      const allText = $content.text().trim();
      if (allText.length > 100) {
        // Split by newlines and filter
        const lines = allText.split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 50 && !isJunkParagraph(line));
        paragraphs.push(...lines);
      }
    }

    const fullText = paragraphs.join("\n\n");
    const wordCount = fullText.split(/\s+/).length;

    logger.info(`Extracted ${paragraphs.length} paragraphs, ${wordCount} words from ${url}`);

    return {
      success: true,
      fullText,
      paragraphs,
      wordCount,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Text extraction failed for ${url}`, { error: errorMessage });

    return {
      success: false,
      fullText: "",
      paragraphs: [],
      wordCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Checks if a paragraph is likely junk/noise
 */
function isJunkParagraph(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Common junk patterns
  const junkPatterns = [
    /^(share|tweet|email|print|subscribe)/i,
    /^(advertisement|sponsored)/i,
    /^(related|more stories|read more)/i,
    /cookie policy|privacy policy/i,
    /sign up|newsletter|follow us/i,
    /\d+\s*(comments|shares)/i,
  ];

  return junkPatterns.some(pattern => pattern.test(lowerText));
}

/**
 * Quick validation to check if extracted text looks reasonable
 */
export function validateExtractedText(result: TextExtractionResult): boolean {
  if (!result.success || !result.fullText) {
    return false;
  }

  // Minimum requirements
  const minWordCount = 50;
  const minParagraphs = 2;

  return (
    result.wordCount >= minWordCount &&
    result.paragraphs.length >= minParagraphs
  );
}

