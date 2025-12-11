import DOMPurify from "dompurify";

/**
 * Strips HTML tags from a string and returns plain text
 * Uses DOMPurify for safe HTML parsing and entity decoding
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  
  // Create a temporary div element to parse HTML
  const tmp = document.createElement("div");
  
  // Use DOMPurify to sanitize and parse HTML safely
  tmp.innerHTML = DOMPurify.sanitize(html, { 
    ALLOWED_TAGS: [], // Strip all tags, just get text
    KEEP_CONTENT: true // Keep text content
  });
  
  // Get text content (automatically strips tags and decodes entities)
  let text = tmp.textContent || tmp.innerText || "";
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  return text;
}

/**
 * Truncates text to a maximum length, adding ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Strips HTML and truncates text for previews
 */
export function getPreviewText(html: string, maxLength: number = 200): string {
  const plainText = stripHtml(html);
  return truncateText(plainText, maxLength);
}


