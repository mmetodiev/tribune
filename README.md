# Tribune - News Aggregation System

A personal news aggregation system with an admin interface for managing sources, categories, and articles. Built with React, TypeScript, and Firebase.

## 🌟 Features

### Backend
- ✅ 19 Firebase Cloud Functions (v2) deployed to production
- ✅ RSS & web scraping support for article fetching
- ✅ Automatic categorization using rule-based matching
- ✅ Scheduled fetch job (runs every 12 hours)
- ✅ Scheduled cleanup job (runs daily at 2 AM)
- ✅ Comprehensive logging with per-source fetch tracking
- ✅ Article deduplication based on URL
- ✅ Data retention management (30-day default)

### Admin Interface
- ✅ Dashboard with real-time stats & fetch logs
- ✅ Sources Manager (add, edit, test, toggle sources)
- ✅ Preset source library (15+ popular news sources)
- ✅ Categories Manager (CRUD operations with rule configuration)
- ✅ Articles Browser (search, filter by source/category)
- ✅ Settings page (data retention, system info)

### User Interface
- ✅ Vintage newspaper-style layout
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time article display with categorization
- ✅ Featured articles with sidebar sections
- ✅ Custom typography (Bebas Neue, Lato, Serif)

## 🚀 Live Demo

**Production URL:** [https://tribune-50450.web.app](https://tribune-50450.web.app)

## 📋 Prerequisites

- Node.js 22 or higher
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with:
  - Authentication enabled (Email/Password or Google Sign-In)
  - Cloud Firestore database
  - Cloud Functions enabled
  - Cloud Scheduler API enabled

## 🛠️ Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for routing
- Firebase SDK for auth & Firestore
- Zustand for state management (planned)

### Backend
- Firebase Functions v2 (Node.js 22)
- Cloud Firestore for data storage
- Cloud Scheduler for cron jobs
- TypeScript throughout

### Libraries
- `rss-parser` - RSS/Atom feed parsing
- `cheerio` - HTML parsing for web scraping
- `axios` - HTTP requests
- `date-fns` - Date parsing and formatting

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tribune
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 3. Firebase Configuration

#### Create `.env.local` for development:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_USE_EMULATORS=true
```

#### Create `.env.production`:

```bash
# Same as above but set VITE_USE_EMULATORS=false
```

### 4. Firebase Security Rules

Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

### 5. Create Initial Admin User

1. Go to Firebase Console > Authentication
2. Add a user manually (Email/Password or enable Google Sign-In)
3. This user will have admin access to the interface

## 🏃 Running Locally

### Start Firebase Emulators

```bash
npm run emulators
```

This starts:
- Functions emulator (port 5001)
- Firestore emulator (port 8080)
- Auth emulator (port 9099)
- Emulator UI (port 4000)

### Start Development Server

In a separate terminal:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port).

## 📝 Usage Guide

### 1. First-Time Setup

1. **Log in** to the admin interface
2. **Add your first category** (e.g., "Technology", "Business")
3. **Add news sources**:
   - Use the preset library for quick setup (TechCrunch, HN, BBC, etc.)
   - Or add custom RSS feeds
4. **Click "Fetch All Sources Now"** to populate articles

### 2. Managing Sources

#### Add Preset Source:
- Go to Admin > Sources
- Click "Add Source"
- Select from "Popular Sources" tab
- Choose a preset and click "Add Source"

#### Add Custom RSS:
- Go to Admin > Sources
- Click "Add Source"
- Switch to "Custom RSS Feed" tab
- Enter name and RSS feed URL
- Click "Test Source" to preview articles
- Save when satisfied

#### Test a Source:
- Click "Test" button next to any source
- Preview fetched articles without saving
- Verify the source is working correctly

### 3. Managing Categories

- Go to Admin > Categories
- Create categories with:
  - **Keywords:** Match in article title/summary
  - **Sources:** Auto-assign articles from specific sources
  - **Domains:** Match articles from specific domains
- Articles are automatically categorized on fetch

### 4. Viewing Articles

#### Admin View:
- Go to Admin > Articles
- Search, filter by source or category
- View all articles with metadata

#### User View:
- Go to the home page (/)
- See articles in vintage newspaper layout
- Featured article + sidebar sections
- Fully responsive design

### 5. Settings & Maintenance

- Go to Admin > Settings
- Adjust data retention period (default: 30 days)
- Run manual cleanup to delete old articles
- View system information and scheduled jobs

## 🚀 Deployment

### Deploy Everything:

```bash
npm run deploy
```

### Deploy Functions Only:

```bash
firebase deploy --only functions
```

### Deploy Frontend Only:

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Firestore Rules:

```bash
firebase deploy --only firestore:rules
```

## 📊 Project Structure

```
tribune/
├── functions/                    # Firebase Functions (TypeScript)
│   ├── src/
│   │   ├── index.ts             # Function exports
│   │   ├── scrapers/            # RSS & web scraping
│   │   ├── categorizers/        # Rule-based categorization
│   │   ├── storage/             # Firestore operations
│   │   ├── core/                # Fetch orchestration
│   │   ├── scheduled/           # Cron jobs
│   │   └── types/               # Shared TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── src/                          # React app (TypeScript)
│   ├── admin/                   # Admin pages
│   │   ├── Dashboard.tsx
│   │   ├── SourcesManager.tsx
│   │   ├── CategoriesManager.tsx
│   │   ├── ArticlesBrowser.tsx
│   │   ├── Settings.tsx
│   │   └── components/          # Admin-specific components
│   ├── user/                    # User-facing pages
│   │   └── NewsView.tsx         # Newspaper layout
│   ├── components/              # Shared components
│   │   └── Layout.tsx
│   ├── lib/                     # Utilities
│   │   ├── firebase.ts          # Firebase config
│   │   ├── api.ts               # API helpers
│   │   └── sourcePresets.ts     # Preset sources library
│   ├── contexts/                # React contexts
│   │   └── auth.jsx             # Auth provider
│   └── types/                   # TypeScript types
│
├── firebase.json                 # Firebase config
├── firestore.rules              # Security rules
├── firestore.indexes.json       # Composite indexes
├── index.html                   # Vite entry point
├── vite.config.js               # Vite configuration
└── package.json                 # Root package.json
```

## 📚 Firestore Collections

### `sources`
Stores news source configurations:
- `name`, `url`, `type` (rss/scrape)
- `enabled` status
- `selectors` for web scraping
- Fetch statistics and error tracking

### `articles`
Stores fetched articles:
- `title`, `url`, `summary`, `author`
- `sourceId`, `sourceName`
- `publishedDate`, `fetchedAt`
- `categories[]` (auto-assigned)
- `imageUrl`

### `categories`
Stores category definitions:
- `name`, `slug`, `description`
- `icon`, `color`
- `rules` (keywords, sources, domains)
- `order` for sorting

### `fetch_logs`
Stores fetch job history:
- `timestamp`, `sourcesProcessed`
- `articlesAdded`, `errors`
- `details[]` (per-source results)

## 🔒 Security

### Firestore Rules
All collections require authentication:

```javascript
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

### Function Security
All callable functions check authentication:

```typescript
function requireAuth(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
}
```

## ⚙️ Scheduled Jobs

### Fetch Job
- **Schedule:** Every 12 hours (`0 */12 * * *`)
- **Function:** `scheduledFetch`
- **Action:** Fetches articles from all enabled sources
- **Logging:** Creates detailed fetch logs with per-source results

### Cleanup Job
- **Schedule:** Daily at 2:00 AM (`0 2 * * *`)
- **Function:** `scheduledCleanup`
- **Action:** Deletes articles older than 30 days
- **Logging:** Logs number of articles deleted

## 🎨 UI/UX Features

### Responsive Design
- **Mobile:** Stacked layout, full-width components
- **Tablet:** 2-column grid for articles
- **Desktop:** Classic newspaper layout (1/5 sidebar + 4/5 main)

### Vintage Newspaper Style
- Cream background (#f9f7f1)
- Dark ink text (#2f2f2f)
- Bebas Neue for section headers
- Lato for article headlines
- Grayscale filter on images

### Loading States
- Dashboard: Loading indicator while fetching data
- Articles: Loading state with message
- Empty states: Helpful prompts for first-time users

## 🔧 Configuration

### Fetch Frequency
Edit `functions/src/scheduled/fetchJob.ts`:

```typescript
schedule: "0 */12 * * *", // Every 12 hours
// or
schedule: "0 6,18 * * *", // 6 AM and 6 PM
```

### Data Retention
Edit `functions/src/scheduled/cleanupJob.ts`:

```typescript
const daysToKeep = 30; // Change to your preference
```

### Timezone
Both scheduled functions use:

```typescript
timeZone: "America/New_York",
```

## 🐛 Troubleshooting

### Functions Not Deploying
```bash
# Check if Cloud Scheduler API is enabled
gcloud services enable cloudscheduler.googleapis.com --project=your-project-id

# Redeploy functions
cd functions
npm run build
firebase deploy --only functions
```

### Emulators Not Starting
```bash
# Kill existing emulator processes
pkill -f firebase

# Clear emulator data cache
rm -rf firebase-data

# Restart emulators
npm run emulators
```

### Build Failing
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

## 📈 Future Enhancements

- [ ] AI-powered categorization (OpenAI/Claude API)
- [ ] Full article text extraction
- [ ] Email digest notifications
- [ ] Reading history and bookmarks
- [ ] Multi-user support with roles
- [ ] Article recommendations
- [ ] Mobile app (React Native)

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- React & Vite for modern frontend development
- TailwindCSS for rapid UI development
- rss-parser for RSS feed parsing
- Cheerio for web scraping capabilities

---

Built with ❤️ using React, TypeScript, and Firebase
