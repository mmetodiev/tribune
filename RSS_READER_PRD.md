# RSS News Reader - Product Requirements Document

**Version**: 1.0  
**Date**: December 10, 2025  
**Status**: Draft

---

## 📋 Executive Summary

Simplify the Tribune project into a clean, focused RSS news reader application. Remove all web scraping functionality, complex backend logic, and unnecessary features. Keep the beautiful newspaper-style UI and implement a straightforward RSS feed aggregation system.

---

## 🎯 Goals

1. **Simplify**: Remove all non-RSS functionality (scraping, text extraction, complex categorization)
2. **Focus**: Pure RSS feed reader with clean UI
3. **Direct Firebase**: Use Firestore directly from front-end (no Functions for CRUD)
4. **Simple Backend**: Minimal RSS fetching service that saves to Firestore
5. **Preserve UI**: Keep the newspaper-style visual design

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Front-End (React/Vite)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  News View   │  │ Article View │  │ Admin Panel  │ │
│  │  (Reader)    │  │  (Detail)    │  │  (Sources)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│              Direct Firestore Operations                │
│              (CRUD for Sources, Read Articles)          │
└────────────────────────────┼───────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Firebase Firestore│
                    │  - sources         │
                    │  - articles        │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  RSS Fetch Service │
                    │  (Backend)         │
                    │  - Fetches RSS     │
                    │  - Saves articles  │
                    └────────────────────┘
```

---

## 📦 Components to Keep

### **Front-End (User Interface)**

#### **Reader Views**
- ✅ `NewsView.tsx` - Main newspaper layout with article grid
- ✅ `ArticleReader.tsx` - Article detail page (shows RSS content)
- ✅ `SourceView.tsx` - Articles filtered by source
- ✅ `ArticleItem.tsx` - Article card component
- ✅ `HeadlineItem.tsx` - Compact headline link
- ✅ `Layout.tsx` - Navigation wrapper

#### **Admin Interface**
- ✅ `Dashboard.tsx` - Stats and overview
- ✅ `SourcesManager.tsx` - Manage RSS sources (CRUD)
- ✅ `ArticlesBrowser.tsx` - Browse all articles
- ✅ `AddSourceModal.tsx` - Add new RSS source
- ✅ `TestSourceModal.tsx` - Test RSS feed

#### **Data Layer (Front-End)**
- ✅ `services/articlesService.ts` - Read articles from Firestore
- ✅ `services/sourcesService.ts` - CRUD operations for sources (direct Firestore)
- ✅ `hooks/useArticles.ts` - React hook for articles
- ✅ `hooks/useSources.ts` - React hook for sources
- ✅ `contexts/ArticlesContext.tsx` - Article state management

#### **Types**
- ✅ `types/index.ts` - TypeScript definitions (cleaned for RSS-only)

---

## ❌ Components to Remove

### **Backend Functions**
- ❌ Entire `/functions` folder
- ❌ All Firebase Functions code
- ❌ Scheduled jobs
- ❌ Complex fetch orchestration

### **Scraping Functionality**
- ❌ Web scraping code (`scrapers/scraper.ts`, `textExtractor.ts`)
- ❌ Scraper configurations and selectors
- ❌ `@mozilla/readability` dependency
- ❌ Text extraction logic

### **Complex Features**
- ❌ Category management (CategoriesManager, category rules)
- ❌ Serendipity distribution (or simplify to basic random)
- ❌ Fetch logs (or simplify significantly)
- ❌ Complex article normalization
- ❌ AI summarization

### **Unused Admin Features**
- ❌ TextExtractionTester
- ❌ Complex settings
- ❌ Advanced source testing

---

## 🔧 Implementation Requirements

### **1. RSS Source Management (Front-End)**

#### **Direct Firestore CRUD Operations**

Replace Firebase Functions with direct Firestore operations:

```typescript
// services/sourcesService.ts
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Create source
export async function createSource(sourceData: SourceFormData) {
  const docRef = await addDoc(collection(db, 'sources'), {
    ...sourceData,
    type: 'rss', // Only RSS now
    enabled: true,
    status: 'active',
    consecutiveFailures: 0,
    totalArticlesFetched: 0,
    averageArticlesPerFetch: 0,
    createdAt: serverTimestamp(),
    lastFetchedAt: null,
    lastSuccessAt: null,
  });
  return docRef.id;
}

// Update source
export async function updateSource(id: string, updates: Partial<Source>) {
  await updateDoc(doc(db, 'sources', id), updates);
}

// Delete source
export async function deleteSource(id: string) {
  await deleteDoc(doc(db, 'sources', id));
}

// Toggle source enabled/disabled
export async function toggleSource(id: string) {
  const sourceRef = doc(db, 'sources', id);
  const sourceSnap = await getDoc(sourceRef);
  if (sourceSnap.exists()) {
    const current = sourceSnap.data();
    await updateDoc(sourceRef, { enabled: !current.enabled });
  }
}
```

#### **Source Form Fields (Simplified)**

```typescript
interface SourceFormData {
  name: string;           // Display name
  url: string;            // RSS feed URL
  enabled: boolean;       // Active/inactive
  updateFrequency: 'hourly' | 'daily' | 'manual'; // How often to fetch
  priority: number;       // Display order (1-10)
  notes?: string;         // Optional notes
}
```

**Removed fields:**
- `selectors` (scraping-related)
- `category` (categories removed)
- `robotsTxtCompliant` (not needed for RSS)
- `termsAccepted` (not needed)

---

### **2. RSS Fetching Backend**

#### **Option A: Simple Node.js Service (Recommended)**

Create a minimal standalone service:

```typescript
// backend/rss-fetcher.ts
import { parseFeed } from "feedsmith";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase-admin/firestore";

async function fetchRSSFeed(source: Source) {
  // Fetch feed
  const response = await fetch(source.url);
  const feedContent = await response.text();
  
  // Parse with feedsmith (existing parser)
  const result = parseFeed(feedContent);
  
  // Map to articles
  const articles = mapFeedItemsToArticles(result, source);
  
  // Save to Firestore
  const db = getFirestore();
  for (const article of articles) {
    const articleId = hashUrl(article.url); // Use URL hash as ID
    const articleRef = doc(db, 'articles', articleId);
    
    // Check if exists
    const exists = await getDoc(articleRef);
    if (!exists.exists()) {
      await setDoc(articleRef, {
        ...article,
        sourceId: source.id,
        sourceName: source.name,
        fetchedAt: serverTimestamp(),
        read: false,
        bookmarked: false,
        hidden: false,
      });
    }
  }
  
  // Update source stats
  await updateDoc(doc(db, 'sources', source.id), {
    lastFetchedAt: serverTimestamp(),
    lastSuccessAt: serverTimestamp(),
    totalArticlesFetched: increment(articles.length),
    status: 'active',
    consecutiveFailures: 0,
  });
}

// Run on schedule (cron or Cloud Scheduler)
```

**Deployment Options:**
- **Cloud Run** (serverless, runs on schedule)
- **Cloud Functions** (simplified, just RSS fetching)
- **Local cron job** (for development)

#### **Option B: Simplified Firebase Function**

Keep one simple function:

```typescript
// functions/src/index.ts (simplified)
import { onSchedule } from "firebase-functions/v2/scheduler";
import { fetchRSS } from "./rss";

export const fetchAllRSSFeeds = onSchedule("every 1 hours", async (event) => {
  // Get all enabled RSS sources
  // Fetch each RSS feed
  // Save articles to Firestore
});
```

**⚠️ DECISION NEEDED**: Which backend approach?
- [ ] Option A: Standalone Node.js service
- [ ] Option B: Simplified Firebase Function
- [ ] Option C: Other: _______________

---

### **3. Article Data Model (Simplified)**

```typescript
interface Article {
  id: string;                    // hash(url) - unique identifier
  title: string;                  // Article title from RSS
  url: string;                    // Original article URL
  sourceId: string;               // Reference to source
  sourceName: string;             // Denormalized source name
  
  // RSS Content
  summary: string;                // RSS description/content (HTML)
  author: string;                 // Author from RSS
  publishedDate: Timestamp | null; // Publication date from RSS
  imageUrl: string;               // Image from RSS feed
  
  // System fields
  fetchedAt: Timestamp;           // When we fetched it
  
  // User interaction (simple)
  read: boolean;                  // Has user read this?
  bookmarked: boolean;            // Is it bookmarked?
  hidden: boolean;                // Is it hidden?
}

// REMOVED:
// - fullText (no text extraction)
// - extractedSummary (no summarization)
// - categories (no categorization)
// - autoCategories (no AI)
// - wordCount (not needed)
// - summarizationMethod (not needed)
```

---

### **4. Article Display**

#### **NewsView (List Page)**
- Show article titles
- Show short blurb (first 150 chars of summary)
- Show article image (if available)
- Link to article detail page
- Keep current newspaper layout design

#### **ArticleReader (Detail Page)**
- Display article title
- Display RSS summary content (sanitized HTML)
- Display article image
- Show metadata (author, source, date)
- Link to original article
- **NO external fetching** - only show what's in RSS feed

**Current implementation already does this correctly!** ✅

---

### **5. RSS Parser**

**Keep existing RSS parser** from `functions/src/scrapers/rss.ts`:

- Uses `feedsmith` library
- Supports RSS, Atom, RDF, JSON Feed
- Preserves HTML content from feeds
- Filters junk summaries
- Maps to `RawArticle` format

**Move to**: `backend/rss-parser.ts` or keep in simplified function.

---

### **6. Admin Dashboard (Simplified)**

#### **Dashboard.tsx**
- Total sources count
- Total articles count
- Last fetch time
- Manual fetch button (triggers backend)
- **Remove**: Complex fetch logs, error details

#### **SourcesManager.tsx**
- List all RSS sources
- Add/Edit/Delete sources (direct Firestore)
- Enable/Disable sources
- Test RSS feed (validate URL)
- Manual fetch for single source
- **Remove**: Scraping-related fields

#### **ArticlesBrowser.tsx**
- List all articles
- Filter by source
- Search by title
- View article details
- **Remove**: Category filtering, complex filters

---

## 🔄 Data Flow

### **Adding a Source (Admin)**
```
1. User fills form in AddSourceModal
2. Front-end validates RSS URL (optional: test fetch)
3. Front-end saves to Firestore 'sources' collection (direct write)
4. Source appears in SourcesManager list
```

### **Fetching Articles (Backend)**
```
1. Backend service runs on schedule (or manual trigger)
2. Queries Firestore for enabled RSS sources
3. For each source:
   a. Fetches RSS feed URL
   b. Parses with feedsmith
   c. Maps items to Article format
   d. Saves to Firestore 'articles' collection (using URL hash as ID)
   e. Updates source stats (lastFetchedAt, totalArticlesFetched)
4. Front-end automatically sees new articles (real-time listener)
```

### **Viewing Articles (User)**
```
1. User visits NewsView
2. Front-end queries Firestore for recent articles
3. Displays article cards with title, blurb, image
4. User clicks article → ArticleReader page
5. ArticleReader loads article from Firestore
6. Displays RSS summary content (sanitized HTML)
7. User can click "View Original" to go to source website
```

---

## 🗄️ Firestore Collections

### **sources**
```typescript
{
  id: string;
  name: string;
  url: string;                    // RSS feed URL
  type: "rss";                    // Always "rss" now
  enabled: boolean;
  updateFrequency: "hourly" | "daily" | "manual";
  priority: number;
  status: "active" | "error" | "disabled";
  lastFetchedAt: Timestamp | null;
  lastSuccessAt: Timestamp | null;
  consecutiveFailures: number;
  totalArticlesFetched: number;
  averageArticlesPerFetch: number;
  errorMessage: string;
  notes: string;
  createdAt: Timestamp;
}
```

### **articles**
```typescript
{
  id: string;                     // hash(url)
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  summary: string;                // RSS content (HTML)
  author: string;
  publishedDate: Timestamp | null;
  imageUrl: string;
  fetchedAt: Timestamp;
  read: boolean;
  bookmarked: boolean;
  hidden: boolean;
}
```

**Indexes needed:**
- `articles.fetchedAt` (descending) - for recent articles
- `articles.sourceId` + `articles.fetchedAt` - for source filtering

---

## 🎨 UI/UX Requirements

### **Keep Current Design**
- ✅ Newspaper-style layout (NewsView)
- ✅ Clean article cards (ArticleItem)
- ✅ Readable article detail page (ArticleReader)
- ✅ Professional admin interface

### **Simplifications**
- Remove category filtering UI
- Remove complex settings
- Simplify fetch logs display
- Remove scraping-related UI elements

---

## 🔐 Security & Firestore Rules

### **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Sources - Admin only
    match /sources/{sourceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Add role check if needed
    }
    
    // Articles - Authenticated users can read, only backend writes
    match /articles/{articleId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write articles
    }
  }
}
```

---

## 📦 Dependencies

### **Keep**
- `react`, `react-dom`, `react-router-dom`
- `firebase` (Firestore, Auth)
- `feedsmith` (RSS parsing) - move to backend
- `dompurify` (sanitize HTML in ArticleReader)
- `tailwindcss` (styling)
- `lucide-react` (icons)

### **Remove**
- `@mozilla/readability` (text extraction)
- Complex state management (if using Redux/Zustand unnecessarily)
- Unused UI libraries

### **Add (if needed)**
- `firebase-admin` (for backend service)

---

## 🚀 Implementation Phases

### **Phase 1: Cleanup & Remove** (2-3 hours)
- [ ] Delete `/functions` folder
- [ ] Remove scraping code
- [ ] Remove category management
- [ ] Remove unused dependencies
- [ ] Clean up types (remove scraping fields)

### **Phase 2: Front-End Refactor** (3-4 hours)
- [ ] Replace Functions calls with direct Firestore operations
- [ ] Update SourcesManager to use direct CRUD
- [ ] Simplify Dashboard
- [ ] Update article service (remove complex logic)
- [ ] Remove unused admin components

### **Phase 3: Backend Service** (2-3 hours)
- [ ] Extract RSS parser to standalone module
- [ ] Create simple fetch service (Node.js or Function)
- [ ] Set up scheduling (cron or Cloud Scheduler)
- [ ] Test RSS fetching and saving

### **Phase 4: Testing & Polish** (1-2 hours)
- [ ] Test source CRUD operations
- [ ] Test RSS fetching
- [ ] Test article display
- [ ] Update Firestore rules
- [ ] Clean up UI

### **Total Estimated Time**: 8-12 hours

---

## ✅ Success Criteria

The refactoring is complete when:

1. ✅ All Firebase Functions removed
2. ✅ Source management works with direct Firestore CRUD
3. ✅ RSS fetching backend saves articles to Firestore
4. ✅ NewsView displays articles correctly
5. ✅ ArticleReader shows RSS content (no external fetching)
6. ✅ Admin panel simplified and functional
7. ✅ No scraping or text extraction code remains
8. ✅ All tests pass (if applicable)
9. ✅ Code is clean and maintainable

---

## ❓ Open Questions

1. **Backend Deployment**: 
   - [ ] Standalone Node.js service (Cloud Run)?
   - [ ] Simplified Firebase Function?
   - [ ] Other?

2. **Fetching Schedule**:
   - [ ] How often? (every hour, every 6 hours, daily?)
   - [ ] Manual only?

3. **Article Deduplication**:
   - [ ] Use URL hash as ID (current approach)?
   - [ ] Check for existing articles before saving?

4. **Error Handling**:
   - [ ] How to handle failed RSS fetches?
   - [ ] Retry logic?
   - [ ] Error notifications?

5. **User Features**:
   - [ ] Keep read/bookmarked/hidden flags?
   - [ ] Add search functionality?
   - [ ] Add pagination?

---

## 📝 Notes

- This is a **simplification**, not a rewrite
- Focus on **removing complexity** while keeping the UI
- The current RSS parser works well - keep it
- ArticleReader already shows RSS content correctly - minimal changes needed
- Direct Firestore operations are simpler than Functions for CRUD

---

**Status**: 🟡 Ready for Review
