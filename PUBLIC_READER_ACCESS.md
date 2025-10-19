# Public Article Reader Access

## Issue
The article reader view was not accessible to unauthenticated users - it required login to view any article.

## Root Cause
The `proxyArticle` Cloud Function (used by the ArticleReader component to fetch and parse article content) had an authentication requirement:

```typescript
export const proxyArticle = onCall(async (request) => {
  requireAuth(request); // ❌ This blocked public access
  // ...
});
```

## Solution
Removed the authentication requirement from the `proxyArticle` function to allow public access to the article reader.

### Changes Made

**File:** `functions/src/index.ts`

**Before:**
```typescript
export const proxyArticle = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
  },
  async (request) => {
    requireAuth(request); // Blocked unauthenticated users
    // ...
  }
);
```

**After:**
```typescript
export const proxyArticle = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
  },
  async (request) => {
    // No authentication required - article reader should be publicly accessible
    // ...
  }
);
```

## Security Considerations

### Why This Is Safe:
1. **Read-only operation**: The function only fetches and parses publicly available article content
2. **Input validation**: URL parameter is validated before processing
3. **No data modification**: The function doesn't write to the database
4. **Rate limiting**: Firebase Functions have built-in rate limiting and quota management
5. **CORS enabled**: Function already had CORS enabled for public access
6. **Firestore rules intact**: Article metadata in Firestore already has public read access (`allow read: if true`)

### Potential Concerns & Mitigations:
- **Abuse/DoS**: Firebase has built-in quotas and rate limiting. Can monitor usage in Firebase Console
- **Cost**: Each function invocation has a cost, but reader usage is expected to be reasonable
- **URL validation**: Function validates that URL is provided before processing

## What's Now Public:
- ✅ **NewsView** (`/`) - Home page with article listings (already public via Firestore rules)
- ✅ **ArticleReader** (`/article/:id`) - Individual article reader view
  - Article metadata (from Firestore) - public read
  - Article content parsing (via proxyArticle function) - now public

## What's Still Protected:
- ❌ **Admin routes** (`/admin/*`) - Require authentication
- ❌ **Write operations** - All source/article modifications require authentication
- ❌ **Admin functions** - createSource, modifySource, testFetch, etc. all still require auth

## Deployment
The updated function was deployed on: **2025-10-19**

```bash
firebase deploy --only functions:proxyArticle
```

Status: ✅ Successfully deployed to `tribune-50450` project

## Testing
To verify the fix works:

1. **Open in incognito/private browsing** (to ensure no cached authentication)
2. **Navigate to the home page**: Should show articles
3. **Click any article**: Should open the reader view
4. **Verify article content loads**: Should display parsed article content without login prompt

Expected behavior: Users can read articles without logging in, but cannot access admin features.

## Future Considerations
- Monitor function usage in Firebase Console to detect any abuse
- Consider implementing rate limiting per IP if needed
- May want to add caching layer for frequently accessed articles

