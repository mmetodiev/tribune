import { logger } from "firebase-functions/v2";

/**
 * Extractive Summarizer Module
 * 
 * Creates summaries by extracting the first 2-3 sentences from article text.
 * Simple, fast, and effective for news articles.
 * 
 * This module is designed to be easily replaceable with AI-based summarization
 * (e.g., Gemini, GPT) without changing the interface.
 */

export interface SummaryOptions {
  /** Number of sentences to extract (default: 2) */
  sentenceCount?: number;
  /** Maximum character length (default: 300) */
  maxLength?: number;
  /** Minimum character length (default: 100) */
  minLength?: number;
}

export interface SummaryResult {
  success: boolean;
  summary: string;
  sentences: string[];
  method: "extractive" | "ai";
  error: string | null;
}

/**
 * Creates a summary by extracting the first N sentences
 * 
 * @param text - Full article text
 * @param options - Summarization options
 * @returns SummaryResult with extracted summary
 */
export function createExtractiveSummary(
  text: string,
  options: SummaryOptions = {}
): SummaryResult {
  try {
    const {
      sentenceCount = 2,
      maxLength = 300,
      minLength = 100,
    } = options;

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        summary: "",
        sentences: [],
        method: "extractive",
        error: "No text provided",
      };
    }

    // Split into sentences
    const sentences = splitIntoSentences(text);

    if (sentences.length === 0) {
      return {
        success: false,
        summary: "",
        sentences: [],
        method: "extractive",
        error: "No sentences found",
      };
    }

    // Take first N sentences
    let selectedSentences = sentences.slice(0, sentenceCount);
    let summary = selectedSentences.join(" ");

    // If summary is too short, add more sentences
    while (
      summary.length < minLength &&
      selectedSentences.length < sentences.length
    ) {
      const nextIndex = selectedSentences.length;
      selectedSentences.push(sentences[nextIndex]);
      summary = selectedSentences.join(" ");
    }

    // If summary is too long, trim to max length
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength).trim();
      
      // Try to end at a sentence boundary
      const lastPeriod = summary.lastIndexOf(".");
      if (lastPeriod > minLength) {
        summary = summary.substring(0, lastPeriod + 1);
      } else {
        summary += "...";
      }
    }

    logger.info(`Created extractive summary: ${selectedSentences.length} sentences, ${summary.length} chars`);

    return {
      success: true,
      summary: summary.trim(),
      sentences: selectedSentences,
      method: "extractive",
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Extractive summarization failed", { error: errorMessage });

    return {
      success: false,
      summary: "",
      sentences: [],
      method: "extractive",
      error: errorMessage,
    };
  }
}

/**
 * Splits text into sentences
 * Handles common abbreviations and edge cases
 */
function splitIntoSentences(text: string): string[] {
  // Replace common abbreviations to avoid false splits
  let processed = text
    .replace(/Mr\./g, "Mr")
    .replace(/Mrs\./g, "Mrs")
    .replace(/Ms\./g, "Ms")
    .replace(/Dr\./g, "Dr")
    .replace(/Inc\./g, "Inc")
    .replace(/Ltd\./g, "Ltd")
    .replace(/Jr\./g, "Jr")
    .replace(/Sr\./g, "Sr")
    .replace(/U\.S\./g, "US")
    .replace(/U\.K\./g, "UK")
    .replace(/etc\./g, "etc");

  // Split on sentence boundaries
  const sentences = processed
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // Filter out very short fragments

  // Restore periods
  return sentences.map(s => {
    s = s
      .replace(/\bMr\b/g, "Mr.")
      .replace(/\bMrs\b/g, "Mrs.")
      .replace(/\bMs\b/g, "Ms.")
      .replace(/\bDr\b/g, "Dr.")
      .replace(/\bInc\b/g, "Inc.")
      .replace(/\bLtd\b/g, "Ltd.")
      .replace(/\bJr\b/g, "Jr.")
      .replace(/\bSr\b/g, "Sr.")
      .replace(/\bUS\b/g, "U.S.")
      .replace(/\bUK\b/g, "U.K.")
      .replace(/\betc\b/g, "etc.");

    // Ensure sentence ends with period
    if (!s.endsWith(".") && !s.endsWith("!") && !s.endsWith("?")) {
      s += ".";
    }

    return s;
  });
}

/**
 * Creates a short summary (1-2 sentences) for display on front page
 */
export function createShortSummary(text: string): SummaryResult {
  return createExtractiveSummary(text, {
    sentenceCount: 2,
    maxLength: 200,
    minLength: 80,
  });
}

/**
 * Creates a medium summary (2-3 sentences) for article cards
 */
export function createMediumSummary(text: string): SummaryResult {
  return createExtractiveSummary(text, {
    sentenceCount: 3,
    maxLength: 300,
    minLength: 150,
  });
}

