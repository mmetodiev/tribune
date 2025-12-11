/**
 * Utility functions for article content analysis
 */

/**
 * Counts words in HTML content by stripping HTML tags and counting words
 * @param html HTML content string
 * @returns Number of words
 */
export function countWordsInHTML(html: string): number {
  if (!html || html.trim().length === 0) {
    return 0;
  }

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Get text content (strips HTML tags)
  const text = tempDiv.textContent || tempDiv.innerText || '';

  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);

  return words.length;
}

/**
 * Determines if an RSS summary is a stub (too short to be meaningful)
 * @param summary RSS summary HTML content
 * @param wordThreshold Minimum word count to be considered non-stub (default: 100)
 * @returns true if summary is a stub, false if it has sufficient content
 */
export function isRSSSummaryStub(summary: string, wordThreshold: number = 100): boolean {
  if (!summary || summary.trim().length === 0) {
    return true; // Empty summary is definitely a stub
  }

  const wordCount = countWordsInHTML(summary);
  return wordCount < wordThreshold;
}

/**
 * Gets a human-readable word count for display
 * @param summary RSS summary HTML content
 * @returns Word count string (e.g., "150 words")
 */
export function getWordCount(summary: string): string {
  const count = countWordsInHTML(summary);
  return `${count} ${count === 1 ? 'word' : 'words'}`;
}
