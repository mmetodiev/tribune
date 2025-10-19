# Refactoring Plan: Move from Functions API to Direct Firestore Queries

## Current Architecture

**Current Flow:**
```
Component → API Function → Firebase Function → Firestore
  (NewsView)  (api.ts)      (functions/index.ts)   (database)
```

**Issues with Current Approach:**
1. **Unnecessary latency** - Extra network hop through Cloud Functions
2. **Cost inefficiency** - Charged for function invocations on every read
3. **Complexity** - Maintaining two codebases (frontend + functions) for simple CRUD
4. **Real-time limitations** - Cannot easily use Firestore real-time listeners
5. **Cold starts** - Functions may have initialization delays

## Proposed Architecture

**New Flow:**
```
Component → Hook → Service → Firestore
  (NewsView)  (useArticles)  (articlesService)  (database)
```

**Benefits:**
1. **Direct queries** - Faster data access, no middle layer
2. **Cost savings** - Only pay for Firestore reads
3. **Real-time updates** - Easy to implement live data with listeners
4. **Simpler codebase** - Less code to maintain
5. **Better DX** - React hooks provide cleaner component code

## What to Keep vs. What to Refactor

### ✅ KEEP Functions For (Server-side operations):
- **Source Management:**
  - `createSource` - validation, initialization
  - `updateSource` - updates with side effects
  - `deleteSource` - cascading deletes
  - `testSource` - requires server-side scraping/RSS parsing
  - `manualFetchSource` - server-side scraping
  - `manualFetchAll` - orchestration of multiple fetches
  
- **Scheduled Operations:**
  - `scheduledFetch` - cron job
  - `scheduledCleanup` - cron job
  
- **Complex Operations:**
  - `cleanupOldArticles` - batch deletes with transaction logic

### 🔄 REFACTOR to Direct Firestore (Read operations):
- **Articles:**
  - `getArticles` → Direct Firestore query
  - `getSerendipityArticles` → Client-side logic + query
  - `getSourceArticles` → Direct Firestore query
  
- **Sources:**
  - `getSources` → Direct Firestore query
  
- **Fetch Logs:**
  - `getFetchLogs` → Direct Firestore query

## Implementation Plan

### Phase 1: Create Service Layer (src/services/)

Create service files that encapsulate Firestore queries:

**1.1 articlesService.ts**
```typescript
// Direct Firestore queries for articles
- getArticles(limit: number)
- getArticlesBySource(sourceId: string, limit: number)
- getSerendipityArticles(totalArticles: number)
- subscribeToArticles(callback) // Real-time listener
```

**1.2 sourcesService.ts**
```typescript
// Direct Firestore queries for sources (read-only)
- getSources()
- getEnabledSources()
- subscribeToSources(callback) // Real-time listener
```

**1.3 fetchLogsService.ts**
```typescript
// Direct Firestore queries for fetch logs
- getFetchLogs(limit: number)
- subscribeToFetchLogs(callback) // Real-time listener
```

### Phase 2: Create Custom Hooks (src/hooks/)

Create React hooks that use the services and manage state:

**2.1 useArticles.ts**
```typescript
// Hook for fetching and managing articles
- useArticles(limit?: number)
- useSerendipityArticles(totalArticles?: number)
- useSourceArticles(sourceId: string, limit?: number)

Returns: { articles, loading, error, refetch }
```

**2.2 useSources.ts**
```typescript
// Hook for fetching sources
- useSources()
- useEnabledSources()

Returns: { sources, loading, error, refetch }
```

**2.3 useFetchLogs.ts**
```typescript
// Hook for fetching logs
- useFetchLogs(limit?: number)

Returns: { logs, loading, error, refetch }
```

### Phase 3: Implement Serendipity Logic Client-Side

The `getSerendipityArticles` function logic needs to be replicated on the client:

**3.1 Algorithm (from functions/src/storage/serendipity.ts):**
1. Fetch articles from last 3 days
2. Group by source
3. Calculate articles per source (even distribution)
4. Randomize selection
5. Fill gaps from other sources if needed
6. Final randomization

**3.2 Implementation Location:**
- `src/services/articlesService.ts` - core logic
- `src/hooks/useSerendipityArticles.ts` - hook wrapper

### Phase 4: Update Components

**4.1 NewsView.tsx**
```typescript
// Before:
const articlesRes = await getSerendipityArticles(40);

// After:
const { articles, loading, error } = useSerendipityArticles(40);
```

**4.2 ArticlesBrowser.tsx**
```typescript
// Before:
const articlesRes = await getArticles(500);
const sourcesRes = await getSources();

// After:
const { articles, loading: articlesLoading } = useArticles(500);
const { sources, loading: sourcesLoading } = useSources();
```

**4.3 Dashboard.tsx**
```typescript
// Keep API calls for mutations (manualFetchAll)
// Update to hooks for reads:
const { logs, loading: logsLoading } = useFetchLogs(10);
const { sources } = useSources();
```

### Phase 5: Security Rules Validation

Ensure Firestore security rules allow authenticated reads:

**firestore.rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Articles: authenticated users can read
    match /articles/{articleId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write
    }
    
    // Sources: authenticated users can read
    match /sources/{sourceId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write
    }
    
    // Fetch logs: authenticated users can read
    match /fetchLogs/{logId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write
    }
  }
}
```

### Phase 6: Update API Layer

**6.1 Deprecate unused functions in api.ts**
- Mark old read functions as deprecated
- Keep only mutation functions (create, update, delete, test, fetch)

**6.2 New api.ts structure:**
```typescript
// ============================================================================
// SOURCE MUTATIONS (Keep as Functions)
// ============================================================================
- createSource()
- updateSource()
- deleteSource()
- toggleSource()
- testSource()
- manualFetchSource()
- manualFetchAll()

// ============================================================================
// ARTICLE OPERATIONS (Keep as Functions)
// ============================================================================
- cleanupOldArticles() // Complex batch operation

// ============================================================================
// DEPRECATED - USE HOOKS INSTEAD
// ============================================================================
// @deprecated Use useArticles() hook instead
- getArticles()
// @deprecated Use useSerendipityArticles() hook instead
- getSerendipityArticles()
// etc...
```

### Phase 7: Testing & Migration

**7.1 Test each service independently**
- Verify Firestore queries return correct data
- Test with emulators first
- Validate against production data

**7.2 Test hooks in isolation**
- Unit tests for hooks
- Mock service layer
- Test loading/error states

**7.3 Gradual component migration**
- Migrate ArticlesBrowser first (simpler)
- Then Dashboard
- Finally NewsView (most complex)

**7.4 Production validation**
- Deploy with feature flag if needed
- Monitor Firestore read costs
- Validate performance improvements

## File Structure

```
src/
├── services/                 # NEW - Firestore service layer
│   ├── articlesService.ts    # Article queries
│   ├── sourcesService.ts     # Source queries
│   ├── fetchLogsService.ts   # Fetch log queries
│   └── utils/
│       ├── firestore.ts      # Shared Firestore utilities
│       └── serendipity.ts    # Serendipity algorithm
│
├── hooks/                    # NEW - Custom React hooks
│   ├── useArticles.ts        # Article hooks
│   ├── useSources.ts         # Source hooks
│   ├── useFetchLogs.ts       # Fetch log hooks
│   └── useSerendipity.ts     # Serendipity-specific hook
│
├── lib/
│   ├── api.ts               # MODIFIED - Keep only mutations
│   └── firebase.ts          # Keep as-is
│
├── admin/
│   ├── ArticlesBrowser.tsx   # UPDATE - Use hooks
│   ├── Dashboard.tsx         # UPDATE - Use hooks
│   └── SourcesManager.tsx    # UPDATE - Use hooks for reads
│
└── user/
    └── NewsView.tsx          # UPDATE - Use hooks
```

## Benefits Summary

### Performance
- **Faster loads** - Eliminate function cold starts (~500ms savings)
- **Lower latency** - One less network hop (~100-200ms savings)
- **Parallel queries** - Can fetch multiple collections simultaneously

### Cost
- **Functions cost** - Eliminate ~1M+ invocations/month for reads
- **Only Firestore reads** - Typically 10x cheaper than function + read

### Developer Experience
- **Real-time updates** - Easy to add live data with `onSnapshot`
- **Better caching** - React Query or SWR integration becomes trivial
- **Simpler debugging** - Can use Firestore console directly
- **Type safety** - TypeScript all the way through

### Scalability
- **No function limits** - No concurrent execution limits for reads
- **Better for mobile** - Offline support with Firestore persistence
- **CDN-friendly** - Firestore has better global distribution

## Migration Risks & Mitigation

### Risk 1: Client-side bundle size increase
**Mitigation:** Firestore SDK is already included; services add ~5-10KB

### Risk 2: Complex queries may be harder to optimize
**Mitigation:** Firestore composite indexes handle most cases; document patterns in code

### Risk 3: Security rules must be correctly configured
**Mitigation:** Comprehensive testing in emulator before production deploy

### Risk 4: Serendipity algorithm may be slower client-side
**Mitigation:** Can still call function if needed; optimize with pagination/caching

### Risk 5: Breaking changes for existing code
**Mitigation:** Gradual migration; keep old API functions as deprecated fallbacks

## Timeline Estimate

- **Phase 1** (Services): 4-6 hours
- **Phase 2** (Hooks): 3-4 hours
- **Phase 3** (Serendipity): 3-4 hours
- **Phase 4** (Components): 4-6 hours
- **Phase 5** (Security): 1-2 hours
- **Phase 6** (API cleanup): 1-2 hours
- **Phase 7** (Testing): 4-6 hours

**Total: 20-30 hours** (2.5-4 days)

## Success Criteria

### Functional
- ✅ All components render correctly with new hooks
- ✅ Articles display properly in NewsView
- ✅ ArticlesBrowser filters work
- ✅ Dashboard shows correct stats
- ✅ No regressions in functionality

### Performance
- ✅ Page load time improves by >200ms
- ✅ No increase in Firestore read costs beyond function elimination savings
- ✅ Serendipity algorithm executes in <500ms

### Code Quality
- ✅ All services have TypeScript types
- ✅ Hooks handle loading/error states
- ✅ No duplicate logic between services
- ✅ Security rules properly configured

## Future Enhancements

Once refactoring is complete, new capabilities become easier:

1. **Real-time updates** - Articles auto-update as new ones arrive
2. **Optimistic UI** - Instant feedback on user actions
3. **Better caching** - Add React Query for intelligent cache management
4. **Offline support** - Firestore persistence for offline-first experience
5. **Pagination** - Infinite scroll with Firestore cursors
6. **Search** - Client-side search or Algolia integration

## Recommendation

**Proceed with refactoring** - The benefits significantly outweigh the risks. The current architecture is over-engineered for read operations. This refactoring will:

1. Reduce costs
2. Improve performance
3. Simplify codebase
4. Enable future enhancements

Start with **Phase 1 (Services)** and **Phase 2 (Hooks)**, then migrate one component at a time in **Phase 4**.

