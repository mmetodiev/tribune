# Article Extraction Feature

## Overview

The article reader now supports progressive enhancement: it displays RSS feed content immediately, then fetches and displays the full article content in the background using Readability.js.

## Architecture

The implementation uses an abstraction layer that allows easy switching between:
- **Firebase Functions** (default): Serverless functions for article extraction
- **HTTP Endpoint** (future): Traditional server (Heroku/Ubuntu) for zero cold starts

## How It Works

1. **Immediate Display**: ArticleReader shows RSS feed summary content instantly
2. **Background Extraction**: In the background, the app fetches the full article and extracts content using Readability.js
3. **Progressive Enhancement**: When extraction completes, the RSS content is replaced with the full article
4. **Caching**: Extracted content is cached in Firestore to avoid re-extraction

## Configuration

### Firebase Functions (Default)

No configuration needed - works out of the box.

### HTTP Endpoint (Heroku/Ubuntu)

To switch to a traditional server:

1. Deploy the server (see `server-example.ts` for reference)
2. Set environment variable in your frontend `.env`:

```bash
VITE_ARTICLE_EXTRACTOR_URL=https://your-server.herokuapp.com
```

The app will automatically use the HTTP endpoint instead of Firebase Functions.

## Firebase Function

The `proxyArticle` function is deployed as a Firebase callable function:
- **Endpoint**: `proxyArticle`
- **Input**: `{ url: string }`
- **Output**: `{ success: boolean, content?: string, ... }`
- **Timeout**: 60 seconds
- **CORS**: Enabled

## Caching

Extracted content is cached in Firestore:
- **Field**: `fullContent` (string, HTML)
- **Timestamp**: `fullContentExtractedAt`
- **Benefit**: Subsequent views load instantly from cache

## Error Handling

- Extraction failures are silent (falls back to RSS content)
- Errors are logged to console for debugging
- User experience is never interrupted

## Future Migration to Heroku/Ubuntu

To migrate to a traditional server:

1. **Deploy Server**:
   ```bash
   # Use server-example.ts as reference
   # Deploy to Heroku or Ubuntu server
   ```

2. **Update Environment Variable**:
   ```bash
   VITE_ARTICLE_EXTRACTOR_URL=https://your-server.com
   ```

3. **No Code Changes Needed**: The abstraction layer handles the switch automatically.

## Dependencies

### Firebase Functions
- `@mozilla/readability`: ^0.6.0
- `jsdom`: ^25.0.1
- `axios`: ^1.7.9

### Frontend
- Uses existing dependencies (no new packages needed)

## Performance

- **RSS Display**: Instant (from Firestore)
- **Extraction**: 1-3 seconds (background, non-blocking)
- **Cached Content**: Instant (from Firestore cache)
- **Cold Start Impact**: Minimal (background fetch, user sees content immediately)

