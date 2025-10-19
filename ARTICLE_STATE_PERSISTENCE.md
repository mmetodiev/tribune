# Article State Persistence Implementation

## Problem
Previously, the home page would re-fetch and re-shuffle articles every time a user navigated away (e.g., to read an article) and came back. This resulted in a poor user experience as the grid layout would completely change, making it difficult to find other articles from the same session.

## Solution
Implemented React Context-based state management to cache articles across navigation:

### Files Created
1. **`src/contexts/ArticlesContext.tsx`**
   - Context provider that manages article state globally
   - Caches fetched articles in memory
   - Provides `fetchArticles()` function that returns cached articles if available
   - Provides `clearCache()` function to manually refresh articles

### Files Modified

1. **`src/main.jsx`**
   - Added `ArticlesProvider` wrapper around the app
   - Articles state is now shared across all components

2. **`src/user/NewsView.tsx`**
   - Replaced `useSerendipityArticles()` hook with `useArticlesContext()`
   - Now uses cached articles from context instead of fetching on every mount
   - Articles maintain their position in the grid across navigation

3. **`src/components/Layout.tsx`**
   - Added "Refresh" button to navigation bar (visible only on home page)
   - Clicking refresh clears the cache and reloads the page with fresh articles
   - Button includes a refresh icon for better UX

## How It Works

1. **First Visit**: User visits home page → Articles are fetched and cached in context
2. **Navigation**: User clicks an article → Navigates to reader view
3. **Return**: User clicks back → Home page displays the same cached articles in the same order
4. **Manual Refresh**: User clicks "Refresh" button → Cache is cleared and new articles are fetched

## Benefits
- ✅ Consistent grid layout when navigating between home and reader views
- ✅ Reduced unnecessary API calls
- ✅ Better user experience - users can easily return to browse other articles
- ✅ Manual refresh option when users want to see new content
- ✅ Cache is session-only (cleared on page reload or manual refresh)

## Technical Details
- Uses React Context API for state management
- Articles are cached in component state, not localStorage
- Cache persists only during the current browser session
- Logging included for debugging article fetch behavior

## Testing
To verify the implementation:

1. **Start the dev server**: `npm run dev`
2. **Visit the home page**: Articles should load (check console for `[ArticlesContext] Fetching articles`)
3. **Note article positions**: Remember the order of articles in the grid
4. **Click on an article**: Navigate to reader view
5. **Click "Back" or navigate back**: The home page should show the exact same articles in the same positions
6. **Check console**: Should see `[ArticlesContext] Using cached articles` instead of fetching again
7. **Click "Refresh"**: Articles should be re-fetched and potentially show in a different order

Expected behavior:
- ✅ Articles maintain their position when navigating between home and reader views
- ✅ No unnecessary re-fetching when returning to home page
- ✅ Refresh button allows manual refresh when desired

