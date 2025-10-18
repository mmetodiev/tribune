import { Timestamp } from "firebase/firestore";

// Source types
export type SourceType = "rss" | "scrape";
export type UpdateFrequency = "hourly" | "daily" | "manual";
export type SourceStatus = "active" | "error" | "disabled";

export interface SourceSelectors {
  articleContainer: string;
  headline: string;
  link: string;
  summary?: string;
  image?: string;
  date?: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  enabled: boolean;

  // Scraping configuration (when type='scrape')
  selectors?: SourceSelectors;

  // Metadata
  category: string;
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

  // Legal/compliance
  robotsTxtCompliant: boolean;
  termsAccepted: boolean;
  notes: string;
}

// Article types
export interface Article {
  id: string; // hash(url)
  title: string;
  url: string;
  sourceId: string;
  sourceName: string; // denormalized for easy display

  // Optional fields
  summary: string;
  author: string;
  publishedDate: Timestamp | null;
  imageUrl: string;

  // System fields
  fetchedAt: Timestamp;

  // Categorization
  categories: string[]; // category IDs
  autoCategories: string[]; // AI-suggested, future phase

  // User interaction (future)
  read: boolean;
  bookmarked: boolean;
  hidden: boolean;
}

// Category types
export interface CategoryRules {
  keywords: string[];
  sources: string[]; // source IDs
  domains: string[]; // URL domains
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string; // for AI categorization later
  color: string; // hex color for UI
  icon: string; // emoji or icon name

  // Manual categorization rules
  rules: CategoryRules;

  order: number; // for display sorting
  createdAt: Timestamp;
}

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
  url: string;
  type: SourceType;
  enabled: boolean;
  selectors?: SourceSelectors;
  category: string;
  updateFrequency: UpdateFrequency;
  priority: number;
  robotsTxtCompliant: boolean;
  termsAccepted: boolean;
  notes: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  rules: CategoryRules;
}
