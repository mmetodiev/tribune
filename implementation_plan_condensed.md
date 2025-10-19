# News Aggregation System - Implementation Plan

## Project Overview
Personal news aggregation system focused on **serendipity** - a randomized mix of articles from diverse sources. Single Firebase repo with Functions and web UI. Focus: working proof of concept, skill demonstration, maintainability.

**Single user (admin) for content management.** Deployment on Firebase Hosting.

## Current Status - Sprint 6 Complete ✅

**Backend (100% Complete):**
- ✅ 18 Firebase Functions deployed to production
- ✅ RSS & web scraping support
- ✅ Scheduled fetch job (every 12 hours)
- ✅ Fetch logging with detailed per-source tracking
- ✅ Article deduplication & storage

**Admin Interface (100% Complete):**
- ✅ Dashboard with stats & fetch logs
- ✅ Sources Manager (add, edit, test, toggle)
- ✅ Articles Browser (search, filter, browse)

**User Interface (Needs Refinement):**
- ✅ NewsView component with vintage newspaper layout
- ✅ Real article data integration
- ⏳ Random article distribution (needs implementation)
- ⏳ Layout adjustments for better balance

**Next:** Sprint 7 - Random Article Distribution & Layout Refinement

## Core Functionalities

### 1. News Sources Management
- Support for RSS/Atom feeds and web scraping
- CRUD operations (create, read, update, delete)
- Enable/disable sources
- Test source functionality (preview before saving)
- Pre-configured library of 15+ popular news sources
- Status tracking (last fetched, consecutive failures, error messages)

### 2. Article Storage & Retrieval
- Automatic article fetching from enabled sources
- URL-based deduplication
- Storage of title, summary, author, date, image, source metadata
- Fetching history and statistics

### 3. Scheduled Operations
- Automated article fetching every 12 hours
- Detailed logging of fetch operations
- Per-source success/failure tracking
- Manual fetch on-demand

### 4. Admin Interface
- Dashboard with system statistics and fetch logs
- Sources Manager with test and preview capabilities
- Articles Browser with search and filtering

### 5. User-Facing Interface - Serendipity Focus
- Vintage newspaper-style layout
- **Random article distribution** - equal representation from each source
- Articles from last 3 days
- Multi-row, multi-column grid layout
- Classic typography and design
- **No categorization** - emphasis on discovery and serendipity

## Technology Stack

**Backend:**
- Firebase Functions v2 (Node.js 22, TypeScript)
- Firestore database
- Firebase Auth
- Libraries: rss-parser, cheerio, axios, date-fns

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- TailwindCSS styling
- React Router
- Firebase SDK

**Development:**
- Firebase Emulators (local dev)
- TypeScript strict mode
- Environment variables for config

## Sprint Implementation History

### Sprint 1: Project Setup & Foundation ✅
- Firebase project structure
- TypeScript configuration
- Firebase emulators setup
- Vite + React + TailwindCSS
- Firebase Auth integration
- Basic routing
- Security rules

### Sprint 2: Backend Core ✅
- TypeScript interfaces/types
- RSS fetcher implementation
- Web scraper implementation
- Article normalization
- Source CRUD functions
- Article storage with deduplication
- Function testing

### Sprint 3: Admin UI - Sources ✅
**Features Delivered:**
- Admin layout with navigation
- Sources Manager page with list view
- "Add Source" modal with two modes:
  - Popular Sources library (15+ presets)
  - Custom RSS Feed form
- "Test Source" modal with preview
- Enable/disable toggles
- Backend integration

**Improvements:**
- Created `sourcePresets.ts` library
- Simplified UI (removed CSS selector complexity)

### Sprint 4: Initial Categorization ✅ (To Be Removed)
**Features Delivered:**
- Category CRUD functions
- Rule-based categorization engine
- Categories Manager UI
- Auto-categorization system

**Note:** Categories will be removed in Sprint 7 to align with serendipity focus.

### Sprint 5: Scheduled Fetch & Logging ✅
**Features Delivered:**
- Scheduled fetch function (cron: "0 */12 * * *")
- Fetch logging system with per-source details
- Dashboard UI with:
  - Real-time statistics
  - Fetch logs with expandable details
  - Color-coded status indicators
  - Progress bars
  - Manual "Fetch All" button
- Articles Browser with:
  - Search functionality
  - Filters (source)
  - Article cards with metadata

**Deployment:**
- 18 Firebase Functions deployed to production
- Scheduled fetch active
- Firestore security rules in place

### Sprint 6: User-Facing Interface ✅
**Features Delivered:**
- NewsView component with vintage newspaper layout:
  - Cream background (#f9f7f1) and dark ink text (#2f2f2f)
  - Tribune masthead with date subhead
  - Left sidebar (1/5 width) with article headlines
  - Main content area (4/5 width) with grid layout
- Typography:
  - Bebas Neue for section headers
  - Lato for article headlines
  - Serif fonts for body text
  - Grayscale filter on images
- Data integration:
  - Real-time article fetching via Firebase Functions API
  - Article titles, summaries, images, sources, dates
  - Clickable headlines (open in new tab)
  - Loading and empty states

### Sprint 7: Serendipity & Layout Refinement (In Progress)
**Goals:**
1. **Remove Categorization System:**
   - Remove Categories Manager from admin UI
   - Remove category-related Firebase Functions
   - Remove category fields from article data model
   - Clean up category references in codebase

2. **Implement Random Article Distribution:**
   - Fetch articles from last 3 days only
   - Distribute articles evenly across sources:
     - If 5 sources and need 20 articles → 4 per source
     - If source has insufficient articles, pull randomly from other sources
   - Randomize article order on page load
   - Update data fetching logic in NewsView

3. **Refine Layout:**
   - **Left Column (1/5 width):** Keep as-is with article headlines
   - **Right Content Area (4/5 width):**
     - **Row 1:** 3 columns, 2 articles each (6 total)
     - **Row 2:** 4 columns, 1 article each (4 total)
     - **Row 3:** 2 columns, 5 articles each (10 total)
   - Remove oversized featured article section
   - Better balance and density

4. **Additional Polish:**
   - Improve UI/UX (spacing, colors, responsiveness)
   - End-to-end testing
   - Write README with screenshots

**Deployment:**
- Deploy updated functions
- Deploy to Firebase Hosting
- Monitor production scheduled fetch

## Future Enhancements (Post-MVP)

### Enhanced Serendipity
- Time-based rotation (refresh mix every N hours)
- User preferences for source weighting
- "Surprise me" button for instant refresh

### AI Features
- AI-generated article summaries
- Related articles suggestions
- Automatic source discovery

### Advanced Features
- Full article text extraction
- Email digest notifications
- Mobile app version
- Bookmarking and reading history (user accounts)

## Success Criteria

### MVP Completion
- ✅ Admin can add sources via UI
- ✅ Test source functionality works
- ✅ Scheduled and manual fetch operational
- ✅ Articles stored with deduplication
- ✅ Dashboard shows detailed logs
- ✅ Articles Browser with search/filters
- ✅ User-facing newspaper layout
- ⏳ Random article distribution with equal source representation
- ⏳ Refined multi-row layout

### Operational Goals
- Fetch frequency: Every 12 hours
- Article retention: Last 3 days minimum
- Performance: Page loads in <2 seconds
- Reliability: 30 days uptime with minimal intervention
- Security: Firestore rules prevent unauthorized access

### Code Quality (Portfolio-Ready)
- TypeScript throughout with proper types
- Clean separation of concerns
- Readable code with comments
- Proper error handling and logging
- README with setup instructions and screenshots

## Timeline
- **Estimated:** 4 weeks for full MVP
- **Progress:** Sprint 6 of 7 complete
- **Remaining:** Sprint 7 (Serendipity & Refinement)
