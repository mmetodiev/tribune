import { Timestamp } from "firebase/firestore";

// Source types
export type SourceType = "rss"; // Only RSS now
export type UpdateFrequency = "hourly" | "daily" | "manual";
export type SourceStatus = "active" | "error" | "disabled";

export interface Source {
  id: string;
  name: string;
  url: string; // RSS feed URL
  type: SourceType; // Always "rss"
  enabled: boolean;

  // Metadata
  updateFrequency: UpdateFrequency;
  priority: number; // 1-10, for display ordering

  // Status tracking
  lastFetchedAt: Timestamp | null;
  lastSuccessAt: Timestamp | null;
  consecutiveFailures: number;
  status: SourceStatus;
  errorMessage: string;

  // Statistics
  totalArticlesFetched: number;
  averageArticlesPerFetch: number;

  // Notes
  notes: string;
  createdAt?: Timestamp;
}

// Article types
export interface Article {
  id: string; // hash(url)
  title: string;
  url: string;
  sourceId: string;
  sourceName: string; // denormalized for easy display

  // RSS Content
  summary: string; // RSS description/content (HTML)
  author: string;
  publishedDate: Timestamp | null;
  imageUrl: string;

  // Extracted Content (optional, cached after first extraction)
  fullContent?: string; // Full article HTML extracted via Readability
  fullContentExtractedAt?: Timestamp; // When the content was extracted

  // System fields
  fetchedAt: Timestamp;

  // User interaction
  read: boolean;
  bookmarked: boolean;
  hidden: boolean;
}

// Categories removed - RSS-only reader doesn't need categorization

// Fetch log types
export interface FetchLogDetail {
  sourceId: string;
  sourceName: string;
  success: boolean;
  articleCount: number;
  error: string | null;
}

export interface FetchLog {
  id: string;
  timestamp: Timestamp;
  sourcesProcessed: number;
  articlesAdded: number;
  errors: number;
  details: FetchLogDetail[];
}

// Raw article types (from fetchers)
export interface RawArticle {
  title?: string;
  headline?: string;
  url?: string;
  link?: string;
  summary?: string;
  description?: string;
  author?: string;
  pubDate?: string;
  published?: string;
  image?: string;
  thumbnail?: string;
}

// Fetch result types
export interface FetchResult {
  success: boolean;
  articles: RawArticle[];
  error: string | null;
}

// Normalized article (before saving to Firestore)
export interface NormalizedArticle {
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  summary: string;
  author: string;
  publishedDate: Date | null;
  imageUrl: string;
  fetchedAt: Date;
}

// Form data types (for UI)
export interface SourceFormData {
  name: string;
  url: string; // RSS feed URL
  type: SourceType; // Always "rss"
  enabled: boolean;
  updateFrequency: UpdateFrequency;
  priority: number;
  notes: string;
}
