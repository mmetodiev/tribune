import { SourceType } from "@/types";

export interface SourcePreset {
  name: string;
  url: string;
  type: SourceType;
  category: string;
  description: string;
  icon?: string;
}

/**
 * Pre-configured popular news sources
 * Users can select these instead of manually entering details
 */
export const sourcePresets: SourcePreset[] = [
  // Technology
  {
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
    type: "rss",
    category: "tech",
    description: "Top stories from Hacker News community",
    icon: "🔶",
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    type: "rss",
    category: "tech",
    description: "Latest technology news and startup coverage",
    icon: "💻",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    type: "rss",
    category: "tech",
    description: "Technology, science, art, and culture",
    icon: "📱",
  },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    type: "rss",
    category: "tech",
    description: "In-depth tech news and analysis",
    icon: "🔬",
  },
  {
    name: "Wired",
    url: "https://www.wired.com/feed/rss",
    type: "rss",
    category: "tech",
    description: "Technology news and culture",
    icon: "⚡",
  },

  // General News
  {
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/rss.xml",
    type: "rss",
    category: "general",
    description: "Global news from BBC",
    icon: "🌍",
  },
  {
    name: "NPR News",
    url: "https://feeds.npr.org/1001/rss.xml",
    type: "rss",
    category: "general",
    description: "National Public Radio news",
    icon: "📻",
  },
  {
    name: "Reuters",
    url: "https://www.reutersagency.com/feed/",
    type: "rss",
    category: "general",
    description: "International news and breaking stories",
    icon: "📰",
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    type: "rss",
    category: "general",
    description: "World news and opinion",
    icon: "🗞️",
  },

  // Business
  {
    name: "Bloomberg",
    url: "https://feeds.bloomberg.com/markets/news.rss",
    type: "rss",
    category: "business",
    description: "Business and financial news",
    icon: "💼",
  },
  {
    name: "Financial Times",
    url: "https://www.ft.com/?format=rss",
    type: "rss",
    category: "business",
    description: "Global business and finance",
    icon: "📈",
  },

  // Science
  {
    name: "Science Daily",
    url: "https://www.sciencedaily.com/rss/all.xml",
    type: "rss",
    category: "science",
    description: "Latest research news",
    icon: "🔬",
  },
  {
    name: "NASA",
    url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    type: "rss",
    category: "science",
    description: "Space and astronomy news",
    icon: "🚀",
  },

  // Design
  {
    name: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/feed/",
    type: "rss",
    category: "design",
    description: "Web design and development",
    icon: "🎨",
  },
  {
    name: "Designer News",
    url: "https://www.designernews.co/?format=rss",
    type: "rss",
    category: "design",
    description: "Design community news",
    icon: "✏️",
  },
];

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: string): SourcePreset[] {
  return sourcePresets.filter((preset) => preset.category === category);
}

/**
 * Get all available categories
 */
export function getPresetCategories(): string[] {
  const categories = new Set(sourcePresets.map((preset) => preset.category));
  return Array.from(categories).sort();
}

/**
 * Search presets by name or description
 */
export function searchPresets(query: string): SourcePreset[] {
  const lowerQuery = query.toLowerCase();
  return sourcePresets.filter(
    (preset) =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery)
  );
}
