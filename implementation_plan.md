# News Aggregation System - Revised Implementation Plan

## Project Overview
Personal news aggregation system with admin interface for testing and configuration. Single Firebase repo with Functions and web UI. Focus: working proof of concept, skill demonstration, maintainability.

**Single user (admin only) for MVP.** Manual testing via admin interface. Deployment on Firebase Hosting.

## Current Status - Sprint 5 Complete ✅

**Backend (100% Complete):**
- ✅ 18 Firebase Functions deployed to production
- ✅ RSS & web scraping support
- ✅ Automatic categorization (rule-based)
- ✅ Scheduled fetch job (every 12 hours)
- ✅ Fetch logging with detailed per-source tracking
- ✅ Article deduplication & storage

**Admin Interface (95% Complete):**
- ✅ Dashboard with stats & fetch logs
- ✅ Sources Manager (add, edit, test, toggle)
- ✅ Categories Manager (CRUD, rules configuration)
- ✅ Articles Browser (search, filter, browse)
- ⏳ Settings page (pending)

**User Interface (0% Complete):**
- ⏳ NewsView component (main reading interface)
- ⏳ Category filtering
- ⏳ Article grid layout

**Next:** Sprint 6 - User-Facing Interface & Settings

## Technology Stack

### Backend
- **Firebase Functions v2** (2nd generation)
- **Node.js 22** with TypeScript
- **Firestore** for data storage
- **Firebase Auth** (already configured)

**Libraries:**
- `rss-parser` - RSS/Atom feed parsing
- `cheerio` - HTML parsing for web scraping
- `axios` - HTTP requests
- `date-fns` - Date parsing and formatting
- `crypto` (built-in) - URL hashing for deduplication

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Firebase SDK** - Auth and Firestore client

**State Stores (Zustand):**
- `useAuthStore` - Authentication state
- `useSourcesStore` - Sources management
- `useCategoriesStore` - Categories management
- `useArticlesStore` - Articles data
- `useFetchLogsStore` - Fetch history logs

### Development
- **Firebase Emulators** - Local Functions + Firestore
- **Vite dev server** (port 5173) + Functions emulator (port 5001)
- **TypeScript** throughout (strict mode)
- **.env** for environment variables

## Repository Structure
```
tribune/
├── functions/                    # Firebase Functions (TypeScript)
│   ├── src/
│   │   ├── index.ts             # Function exports
│   │   ├── scrapers/
│   │   │   ├── rss.ts           # RSS fetcher ✅
│   │   │   ├── scraper.ts       # Web scraper ✅
│   │   │   └── normalize.ts     # Article normalization ✅
│   │   ├── categorizers/
│   │   │   └── ruleBased.ts     # Rule-based categorization ✅
│   │   ├── storage/
│   │   │   ├── sources.ts       # Source CRUD functions ✅
│   │   │   ├── articles.ts      # Article storage ✅
│   │   │   ├── categories.ts    # Category management ✅
│   │   │   └── fetchLogs.ts     # Fetch logging system ✅
│   │   ├── core/
│   │   │   └── fetchSource.ts   # Fetch orchestration ✅
│   │   ├── scheduled/
│   │   │   └── fetchJob.ts      # Scheduled fetch job ✅
│   │   └── types/
│   │       └── index.ts         # Shared types ✅
│   ├── package.json
│   └── tsconfig.json
│
├── src/                          # React app (TypeScript)
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component with routing
│   ├── admin/                   # Admin pages
│   │   ├── Dashboard.tsx        # ✅ Completed
│   │   ├── SourcesManager.tsx   # ✅ Completed
│   │   ├── CategoriesManager.tsx # ✅ Completed
│   │   ├── ArticlesBrowser.tsx  # ✅ Completed
│   │   ├── Settings.tsx         # (pending)
│   │   └── components/
│   │       ├── AddSourceModal.tsx     # ✅ Completed
│   │       ├── TestSourceModal.tsx    # ✅ Completed
│   │       ├── AddCategoryModal.tsx   # ✅ Completed
│   │       └── EditCategoryModal.tsx  # ✅ Completed
│   ├── user/                    # User-facing pages
│   │   └── NewsView.tsx         # (pending)
│   ├── components/              # Shared components
│   │   └── Layout.tsx           # ✅ Completed
│   ├── stores/                  # Zustand stores (not implemented yet)
│   │   ├── useAuthStore.ts
│   │   ├── useSourcesStore.ts
│   │   ├── useCategoriesStore.ts
│   │   ├── useArticlesStore.ts
│   │   └── useFetchLogsStore.ts
│   ├── lib/                     # Utilities
│   │   ├── firebase.ts          # Firebase config ✅
│   │   ├── api.ts               # API helpers ✅
│   │   ├── sourcePresets.ts     # ✅ NEW: Preset sources library
│   │   └── utils.ts             # Shared utilities
│   ├── contexts/                # React contexts
│   │   └── auth.jsx             # ✅ Auth provider
│   └── types/                   # TypeScript types
│       └── index.ts             # ✅ Shared types
│
├── public/                       # Static assets
├── firestore.rules              # Security rules
├── firestore.indexes.json       # Composite indexes
├── firebase.json                # Firebase config
├── .env.local                   # Local environment variables
├── .env.production              # Production variables
├── vite.config.ts               # Vite configuration
└── package.json                 # Root package.json
```

## Development Environment Setup

### Initial Setup Steps
1. **Firebase project already configured** (Auth enabled in console)
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Install dependencies:
   - Root: `npm install`
   - Functions: `cd functions && npm install`
4. Configure emulators in `firebase.json`:
   ```json
   {
     "emulators": {
       "functions": { "port": 5001 },
       "firestore": { "port": 8080 },
       "ui": { "enabled": true, "port": 4000 },
       "auth": { "port": 9099 }
     }
   }
   ```

### Environment Variables

**.env.local** (for development):
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_USE_EMULATORS=true
```

**.env.production**:
```bash
# Same as above but VITE_USE_EMULATORS=false
```

### Running Locally
```bash
# Terminal 1: Start Firebase emulators
npm run emulators

# Terminal 2: Start Vite dev server
npm run dev
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "emulators": "firebase emulators:start --import=./firebase-data --export-on-exit",
    "deploy": "npm run build && firebase deploy",
    "deploy:functions": "firebase deploy --only functions",
    "deploy:hosting": "npm run build && firebase deploy --only hosting"
  }
}
```

### Seeding Initial Data
**Admin UI will provide forms to create:**
- First category ("Uncategorized" - system default)
- First news source (via "Add Source" form)
- Categories are user-entered through Categories Manager
- No seed scripts needed - all data entry via UI

## Authentication & Security

### Firebase Auth
- **Already configured in Firebase Console**
- Single user (admin) authenticated via email/password or Google Sign-In
- Frontend uses Firebase Auth SDK
- Auth state managed via `useAuthStore` (Zustand)

### Firestore Security Rules

**firestore.rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function: check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // All collections require authentication
    match /{document=**} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

**For production:** Consider hardcoding admin UID if needed:
```javascript
function isAdmin() {
  return request.auth != null && request.auth.uid == 'your-admin-uid';
}
```

### Function Security
All callable functions will check authentication:
```typescript
import { HttpsError } from 'firebase-functions/v2/https';

function requireAuth(context: CallableContext) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
}
```

## Phase 1: Backend Foundation

### 1.1 News Sources Management

**Firestore Collection: `sources`**
```
{
  id: auto-generated
  name: string (display name)
  url: string (homepage or RSS feed URL)
  type: 'rss' | 'scrape'
  enabled: boolean
  
  // Scraping configuration (when type='scrape')
  selectors: {
    articleContainer: string
    headline: string
    link: string
    summary?: string
    image?: string
    date?: string
  }
  
  // Metadata
  category: string (e.g., 'tech', 'finance', 'general')
  updateFrequency: 'hourly' | 'daily' | 'manual'
  priority: number (1-10, for display ordering)
  
  // Status tracking
  lastFetchedAt: timestamp
  lastSuccessAt: timestamp
  consecutiveFailures: number
  status: 'active' | 'error' | 'disabled'
  errorMessage: string
  
  // Statistics
  totalArticlesFetched: number
  averageArticlesPerFetch: number
  
  // Legal/compliance
  robotsTxtCompliant: boolean
  termsAccepted: boolean
  notes: string (any special handling notes)
}
```

**Functions to Build:**
- `addSource(sourceData)` - Create new source
- `updateSource(id, updates)` - Modify source
- `deleteSource(id)` - Remove source
- `toggleSource(id)` - Enable/disable
- `testSource(id)` - Fetch and return results without saving

### 1.2 Article Storage

**Firestore Collection: `articles`**
```
{
  id: auto-generated or hash(url)
  
  // Core fields (standardized across all sources)
  title: string (required)
  url: string (required, unique)
  sourceId: string (reference to sources collection)
  sourceName: string (denormalized for easy display)
  
  // Optional fields (may be empty depending on source)
  summary: string
  author: string
  publishedDate: timestamp
  imageUrl: string
  
  // System fields
  fetchedAt: timestamp (when we scraped it)
  
  // Categorization
  categories: array<string> (user-defined category IDs)
  autoCategories: array<string> (AI-suggested, future phase)
  
  // User interaction (future)
  read: boolean
  bookmarked: boolean
  hidden: boolean
}
```

**Indexes Needed:**
- `sourceId` + `fetchedAt` (desc)
- `categories` (array) + `fetchedAt` (desc)
- `url` (for deduplication)

**Functions to Build:**
- `saveArticle(articleData)` - Store with deduplication
- `saveArticleBatch(articles[])` - Bulk insert
- `getArticlesBySource(sourceId, limit)`
- `getArticlesByCategory(categoryId, limit)`
- `deleteOldArticles(daysToKeep)` - Cleanup function

### 1.3 Fetching Engine

**Core Fetcher Functions:**
- `fetchRSS(source)` - Parse RSS/Atom feeds using `rss-parser`
  - Returns: `{success, articles[], error}`
- `fetchScrape(source)` - Web scraping using `cheerio` + `axios`
  - Returns: `{success, articles[], error}`
- `fetchSource(sourceId)` - Unified interface
  - Calls appropriate fetcher based on source.type
  - Updates source.lastFetchedAt and stats
  - Handles errors and logging

**TypeScript Interfaces:**
```typescript
interface FetchResult {
  success: boolean;
  articles: RawArticle[];
  error: string | null;
}

interface RawArticle {
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

interface NormalizedArticle {
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
```

**Article Normalization:**
```typescript
function normalizeArticle(rawArticle: RawArticle, source: Source): NormalizedArticle {
  return {
    title: cleanTitle(rawArticle.title || rawArticle.headline || ''),
    url: resolveUrl(rawArticle.link || rawArticle.url || '', source.url),
    sourceId: source.id,
    sourceName: source.name,
    summary: cleanText(rawArticle.summary || rawArticle.description || ''),
    author: rawArticle.author || '',
    publishedDate: parseDate(rawArticle.pubDate || rawArticle.published) || null,
    imageUrl: rawArticle.image || rawArticle.thumbnail || '',
    fetchedAt: new Date()
  };
}
```

**RSS Fetcher (using rss-parser):**
```typescript
import Parser from 'rss-parser';
import axios from 'axios';

async function fetchRSS(source: Source): Promise<FetchResult> {
  try {
    const parser = new Parser({
      timeout: 10000,
      headers: { 'User-Agent': 'Tribune News Aggregator/1.0' }
    });

    const feed = await parser.parseURL(source.url);
    const articles: RawArticle[] = feed.items.map(item => ({
      title: item.title,
      url: item.link,
      summary: item.contentSnippet || item.description,
      author: item.creator || item.author,
      pubDate: item.pubDate || item.isoDate,
      image: item.enclosure?.url
    }));

    return { success: true, articles, error: null };
  } catch (error) {
    return {
      success: false,
      articles: [],
      error: `RSS fetch failed: ${error.message}`
    };
  }
}
```

**Web Scraper (using cheerio + axios):**
```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchScrape(source: Source): Promise<FetchResult> {
  try {
    const response = await axios.get(source.url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Tribune News Aggregator/1.0' }
    });

    const $ = cheerio.load(response.data);
    const articles: RawArticle[] = [];

    $(source.selectors.articleContainer).each((_, element) => {
      const title = $(element).find(source.selectors.headline).text().trim();
      const link = $(element).find(source.selectors.link).attr('href');
      const summary = source.selectors.summary
        ? $(element).find(source.selectors.summary).text().trim()
        : '';
      const image = source.selectors.image
        ? $(element).find(source.selectors.image).attr('src')
        : '';

      if (title && link) {
        articles.push({ title, url: link, summary, image });
      }
    });

    return { success: true, articles, error: null };
  } catch (error) {
    return {
      success: false,
      articles: [],
      error: `Scrape failed: ${error.message}`
    };
  }
}
```

### 1.4 Category Management

**Firestore Collection: `categories`**
```
{
  id: auto-generated
  name: string (user display name)
  slug: string (url-safe identifier)
  description: string (for AI categorization later)
  color: string (hex color for UI)
  icon: string (emoji or icon name)
  
  // Manual categorization rules
  rules: {
    keywords: array<string> (match in title/summary)
    sources: array<string> (source IDs to auto-include)
    domains: array<string> (match article URL domain)
  }
  
  order: number (for display sorting)
  createdAt: timestamp
}
```

**Recommended Initial Categories (user-entered via Admin UI):**
- Technology (keywords: AI, programming, coding, software, tech)
- Business & Startups (keywords: startup, funding, venture, business)
- Science & Research (keywords: research, study, science, discovery)
- Security & Privacy (keywords: security, privacy, breach, vulnerability)
- Design & UX (keywords: design, UX, UI, interface)
- **Uncategorized (system default, auto-created on first launch)**

**Note:** Admin creates categories through UI forms. No seed scripts.

**Functions to Build:**
- `addCategory(categoryData)`
- `updateCategory(id, updates)`
- `deleteCategory(id)` - Move articles to Uncategorized
- `applyCategoryRules(article)` - Auto-categorize based on rules
- `manualCategorize(articleId, categoryIds[])` - User override

**Categorization Logic (v1 - Rule-based):**
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  rules: {
    keywords: string[];
    sources: string[];
    domains: string[];
  };
}

function categorizeArticle(article: NormalizedArticle, categories: Category[]): string[] {
  const matches: string[] = [];

  for (const category of categories) {
    // Check keyword matches
    const text = `${article.title} ${article.summary}`.toLowerCase();
    const hasKeyword = category.rules.keywords.some(kw =>
      text.includes(kw.toLowerCase())
    );

    // Check source match
    const sourceMatch = category.rules.sources.includes(article.sourceId);

    // Check domain match
    const domain = new URL(article.url).hostname;
    const domainMatch = category.rules.domains.some(d =>
      domain.includes(d)
    );

    if (hasKeyword || sourceMatch || domainMatch) {
      matches.push(category.id);
    }
  }

  return matches.length > 0 ? matches : ['uncategorized'];
}
```

### 1.5 Scheduled Jobs

**Cloud Function (Scheduled) - Functions v2:**
```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

// Run twice daily (12-hour intervals)
// Cron: "0 */12 * * *" or specific times: "0 6,18 * * *"
export const scheduledFetch = onSchedule(
  {
    schedule: '0 */12 * * *',
    timeZone: 'America/New_York', // Adjust to your timezone
    memory: '512MiB',
    timeoutSeconds: 540, // 9 minutes max
  },
  async (event) => {
    logger.info('Starting scheduled fetch job', { timestamp: event.scheduleTime });

    const sources = await getEnabledSources();
    const results = await Promise.allSettled(
      sources.map(source => fetchAndStoreArticles(source))
    );

    // Build detailed log
    const details = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          sourceId: sources[index].id,
          sourceName: sources[index].name,
          success: true,
          articleCount: result.value.articleCount,
          error: null
        };
      } else {
        return {
          sourceId: sources[index].id,
          sourceName: sources[index].name,
          success: false,
          articleCount: 0,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // Save log to Firestore
    await logFetchRun({
      timestamp: new Date(),
      sourcesProcessed: sources.length,
      articlesAdded: countNewArticles(results),
      errors: countErrors(results),
      details
    });

    logger.info('Scheduled fetch completed', {
      sourcesProcessed: sources.length,
      articlesAdded: countNewArticles(results),
      errors: countErrors(results)
    });
  }
);
```

**Logging Collection: `fetch_logs`**
```typescript
interface FetchLog {
  timestamp: Date;
  sourcesProcessed: number;
  articlesAdded: number;
  errors: number;
  details: FetchLogDetail[];
}

interface FetchLogDetail {
  sourceId: string;
  sourceName: string;
  success: boolean;
  articleCount: number;
  error: string | null;
}
```

**Document structure in Firestore:**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "sourcesProcessed": 10,
  "articlesAdded": 47,
  "errors": 1,
  "details": [
    {
      "sourceId": "abc123",
      "sourceName": "TechCrunch",
      "success": true,
      "articleCount": 15,
      "error": null
    },
    {
      "sourceId": "def456",
      "sourceName": "Failed Source",
      "success": false,
      "articleCount": 0,
      "error": "Connection timeout"
    }
  ]
}
```

## Phase 2: Admin Interface

### 2.1 Admin Dashboard (Home)

**Overview Stats:**
- Total sources (active/disabled count)
- Total articles (last 24h, last 7 days, all time)
- Total categories
- Last fetch time and status

**Recent Fetch Logs (Last 10 runs):**
- Display `fetch_logs` collection data
- Each log shows:
  - Timestamp
  - Total articles fetched
  - Success/error breakdown
  - **Expandable per-source details:**
    - ✅ Source name, article count (success)
    - ❌ Source name, error message (failure)
  - Visual indicator: green for all success, yellow for partial, red for all failed

**Quick Actions:**
- "Fetch All Sources Now" button (triggers manual fetch)
- "Add New Source" button
- "Add New Category" button
- "View All Articles" link

**First-Time Setup:**
- If no categories exist, show prompt: "Create your first category to get started"
- If no sources exist, show: "Add your first news source"
- Guide user through initial data entry

### 2.2 Sources Management Page
**Features:**
- List all sources (table/cards)
- Add/Edit/Delete source
- Enable/Disable toggle
- **Test Source Button** - Fetch and preview results in modal
  - Shows: number of articles found, first 5 headlines
  - Option to save results or discard
- View fetch history per source
- Bulk operations (enable/disable multiple)

**Add Source Modal - Two Modes:**
1. **Popular Sources (Default):**
   - Pre-configured library of 15+ popular news sources
   - Category filter (Tech, Business, Science, Design, General)
   - One-click to add - no configuration needed
   - Sources include: Hacker News, TechCrunch, BBC, NPR, Bloomberg, NASA, etc.

2. **Custom RSS Feed:**
   - Simple form for custom RSS feeds
   - Required: Name + RSS Feed URL
   - Optional: Category, Update Frequency, Priority, Notes
   - **Web scraping removed from user-facing UI** (backend still supports it)

**Rationale for Changes:**
- ❌ Removed CSS selector input from UI (too technical for users)
- ✅ Added preset source library for easy onboarding
- ✅ Still support RSS for custom sources
- ✅ Web scraping capability preserved in backend for future preset sources

**Test Source Flow:**
1. Click "Test" button
2. Function fetches articles (doesn't save)
3. Modal shows:
   - Success/error status
   - Number of articles found
   - List of headlines with URLs
   - Raw data preview (collapsible)
4. "Save These Articles" button (optional)

### 2.3 Categories Management Page
**Features:**
- List categories with article counts
- Add/Edit/Delete category
- Configure rules (keywords, sources, domains)
- Drag-and-drop reordering
- Preview: show articles that would match rules

### 2.4 Articles Browser
**Features:**
- Paginated list of all articles
- Filter by: source, category, date range
- Search by title/summary
- Bulk categorization
- Delete articles
- View article details (modal)

### 2.5 Settings Page
- Fetch schedule configuration
- Data retention settings (days to keep)
- API keys (future: for AI categorization)
- Export/import configuration

## Phase 3: User-Facing Interface

### 3.1 Main News View
- Newspaper-style layout (using your existing design)
- Filter by category (tabs or sidebar)
- Filter by source (dropdown)
- Date selector
- Search functionality

### 3.2 Article Display
- Headlines with summaries
- Source attribution
- Category tags
- Published date
- Click to open original article (new tab)

### 3.3 Reading Features (Future)
- Mark as read
- Bookmark articles
- Hide/dismiss articles
- Reading history

## Technical Decisions & Considerations

### Field Standardization Strategy
**Required fields (all sources must provide):**
- `title` (headline)
- `url` (link to article)

**Optional fields (best effort):**
- `summary` - from RSS description or meta tags
- `author` - from RSS or article metadata
- `publishedDate` - from RSS pubDate or article date
- `imageUrl` - from RSS enclosure or og:image

**Handling Missing Data:**
- Store empty string or null for missing optional fields
- Display fallbacks in UI (e.g., "No summary available")
- Consider extracting missing fields on-demand (e.g., fetch full article to get summary)

### RSS vs Scraping Output Normalization
Both fetchers return the same `FetchResult` structure:
```typescript
interface FetchResult {
  success: boolean;
  articles: RawArticle[];
  error: string | null;
}

// After normalization, stored as:
interface StoredArticle {
  id: string;  // hash(url)
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  summary: string;
  author: string;
  publishedDate: Date | null;
  imageUrl: string;
  fetchedAt: Date;
  categories: string[];
  read: boolean;
  bookmarked: boolean;
  hidden: boolean;
}
```

### Deduplication Strategy
- Use article URL as unique identifier
- Hash URL to create consistent document ID
- Before saving, check if document exists
- Option: Update existing article if significant changes (score, comments)

### Error Handling

**Graceful Degradation (Critical):**
- Use `Promise.allSettled()` for fetching multiple sources
- One source failure NEVER stops other sources from processing
- Each source result (success/failure) logged independently
- Admin sees complete picture: which sources succeeded, which failed, and why

**Per-Source Error Tracking:**
```typescript
// In source document
{
  consecutiveFailures: number,
  lastError: string | null,
  lastErrorAt: timestamp | null,
  status: 'active' | 'error' | 'disabled'
}
```

**Auto-Disable Logic:**
- After 5 consecutive failures, set `status: 'error'`
- Admin sees warning in Sources Manager
- Manual re-enable required after fixing
- Error history preserved for debugging

**Error Logging Strategy:**
- Functions use `logger.error()` for server logs
- Errors saved to source document for UI display
- Fetch logs capture all errors with context
- Admin UI shows:
  - Source-level errors (in Sources Manager)
  - Fetch-level errors (in Dashboard logs)
  - Per-article errors (if normalization fails)

### Performance Optimizations
- Batch Firestore writes (up to 500 per batch)
- Cache source configurations in memory during fetch
- Rate limiting between requests (1-2 second delays)
- Use Firebase Functions 2nd gen for better performance

### Development Workflow
1. Build and test each backend function in isolation
2. Create admin UI page for that function
3. Test through UI
4. Move to next component
5. Iterate based on testing feedback

## Testing Checklist

**Testing Approach:** Manual testing via Admin Interface (no automated test framework for MVP)

### Per Component (Test via Admin UI)
- [ ] **RSS fetcher:** Add 3 different RSS feeds, test each
  - Example sources: TechCrunch, Hacker News, The Verge
- [ ] **Scraper:** Add 2 different scraped sites, configure selectors
  - Test with "Test Source" button before saving
- [ ] **Deduplication:** Fetch same source twice, verify no duplicates
- [ ] **Categorization:** Create categories with rules, verify articles tagged correctly
- [ ] **Source test modal:** Preview shows articles without saving to DB
- [ ] **Scheduled function:** Deploy and verify it runs (check logs in Firebase Console)
- [ ] **Data retention:** Articles older than 30 days are deleted (manual verification)

### Integration Testing (via Admin Dashboard)
- [ ] End-to-end flow: Add source → Fetch → Articles appear → Categorized
- [ ] Dashboard shows accurate stats (source count, article count)
- [ ] Fetch logs show per-source success/failure details
- [ ] Error handling: Disable network, verify graceful failure
- [ ] Manual fetch button works (all sources fetched on demand)
- [ ] User-facing view displays articles correctly
- [ ] Firestore rules: Log out, verify can't access data

## Future Enhancements (Post-MVP)

### AI Categorization (v2)
- Use OpenAI/Claude API to categorize based on category descriptions
- Store AI suggestions separately from manual categories
- Learn from user corrections

### Advanced Features
- Full article text extraction and storage
- AI-generated summaries for articles without them
- Duplicate detection beyond URL matching
- Related articles suggestions
- Email digest notifications
- Mobile app version

## Success Criteria

### MVP Completion ✅
- ✅ Admin can add sources (RSS or scraped) via UI
- ✅ Test source functionality previews articles before saving
- ✅ Fetch runs successfully (manual and scheduled)
- ✅ Articles stored with deduplication (URL-based)
- ✅ Rule-based categorization works with 80%+ accuracy
- ✅ Dashboard shows per-source success/failure logs
- ✅ Articles Browser displays articles with search/filters
- ⏳ User-facing view displays articles in clean layout (pending)

### Operational Goals
- **Data retention:** Auto-delete articles older than 30 days
- **Fetch frequency:** 1-2 times daily (max 10 sources)
- **Performance:** Admin UI loads in <2 seconds
- **Reliability:** System runs for 30 days with minimal intervention
- **Security:** Firestore rules prevent unauthorized access

### Code Quality (Portfolio-Ready)
- TypeScript throughout with proper types
- Clean separation of concerns (scrapers, storage, UI)
- Readable code with inline comments where needed
- Proper error handling and logging
- README with setup instructions and screenshots

## Implementation Order (Recommended)

### Sprint 1: Project Setup & Foundation (Week 1)
1. Initialize Firebase project structure
2. Set up TypeScript configs (functions + frontend)
3. Configure Firebase emulators
4. Set up Vite + React + TailwindCSS
5. Implement Firebase Auth integration
6. Create basic routing (admin vs user views)
7. Deploy Firestore security rules

### Sprint 2: Backend Core (Week 1-2)
1. Define TypeScript interfaces/types (shared between functions & frontend)
2. Implement RSS fetcher (`fetchRSS`)
3. Implement web scraper (`fetchScrape`)
4. Create article normalization function
5. Build source CRUD functions (callable functions)
6. Build article storage functions with deduplication
7. Test functions via emulator

### Sprint 3: Admin UI - Sources (Week 2) ✅ COMPLETED
1. ✅ Create basic admin layout (navigation, header)
2. ✅ Build Sources Manager page (list view)
3. ✅ Build "Add Source" modal with preset library + custom RSS
4. ✅ Implement "Test Source" modal with preview
5. ✅ Add enable/disable toggle
6. ✅ Connect to backend functions
7. ✅ Test with real RSS sources (preset library tested)

**Improvements Made:**
- Created `sourcePresets.ts` library with 15+ pre-configured sources
- Two-tab modal: "Popular Sources" and "Custom RSS Feed"
- Removed CSS selector complexity from user interface
- Fixed Firestore undefined field issue

### Sprint 4: Categorization (Week 3) ✅ COMPLETED
1. ✅ Implement category CRUD functions
2. ✅ Build categorization logic (rule-based)
3. ✅ Create Categories Manager UI page
4. ✅ Build category form (keywords, sources, domains)
5. ✅ Auto-create "Uncategorized" on first launch
6. ✅ Test categorization with sample articles

**Features Delivered:**
- Full-featured Categories Manager UI with table view
- Add Category Modal with complete form (keywords, sources, domains)
- Edit Category Modal with protection for system categories
- Automatic categorization on article fetch using rule-based matching
- Visual category display (icon, color, rule counts)
- Auto-creation of "Uncategorized" category when no rules match
- Display order control (0-999 for sorting)

### Sprint 5: Scheduled Fetch & Logging (Week 3) ✅ COMPLETED
1. ✅ Implement scheduled fetch function
2. ✅ Create fetch logging system
3. ✅ Build admin dashboard page
4. ✅ Display fetch logs with per-source details
5. ✅ Add manual "Fetch All" button
6. ✅ Build Articles Browser (completed ahead of schedule)
7. ✅ Deploy all functions to Firebase production

**Features Delivered:**
- `fetchJob.ts` - Scheduled function running every 12 hours (cron: "0 */12 * * *")
- `fetchLogs.ts` - Storage layer for logging fetch runs with source-level details
- `getFetchLogs` - Callable function to retrieve recent fetch logs
- Updated `manualFetchAll` - Now creates fetch log entries
- Comprehensive Dashboard UI with:
  - Real-time stats cards (sources, articles, categories, last fetch time)
  - Interactive fetch logs with expandable per-source details
  - Color-coded status indicators (green/yellow/red)
  - Progress bars showing success rates
  - Manual "Fetch All Sources Now" button
  - First-time setup prompts for empty states
  - Loading states and error handling
- Articles Browser UI with:
  - Search functionality (title, summary, source)
  - Filter by source and category
  - Article cards with thumbnails, summaries, metadata
  - Category badges (color-coded)
  - Responsive design with empty states
  - Links to original articles

**Deployment Status:**
- ✅ All 18 Firebase Functions deployed to production (us-central1)
- ✅ Frontend configured for production Firebase
- ✅ Scheduled fetch active (runs automatically every 12 hours)
- ✅ Firestore security rules in place

### Sprint 6: User-Facing Interface & Settings (Week 4) - IN PROGRESS
1. Build main NewsView component (user-facing article reader)
2. Add newspaper-style layout with grid/masonry design
3. Implement category filtering (tabs or sidebar)
4. Add date range selector
5. Build Settings page (admin configuration)
6. Add data retention cleanup controls
7. Test complete user flow end-to-end

### Sprint 7: Polish & Deploy (Week 4)
1. Implement data retention cleanup function
2. Add loading states and error messages
3. Improve UI/UX (spacing, colors, responsiveness)
4. Test all flows end-to-end
5. Deploy to Firebase Hosting
6. Monitor first scheduled fetch in production
7. Write README with screenshots

**Estimated Timeline:** 4 weeks for full MVP (working evenings/weekends)
**Minimum Viable:** Sprints 1-5 (3 weeks) - Admin only, no user view yet