# Test RSS Sources

Use these sources to test your news aggregator:

## Technology News

### Hacker News
- **Name**: Hacker News
- **Type**: RSS
- **URL**: https://hnrss.org/frontpage
- **Category**: tech

### TechCrunch
- **Name**: TechCrunch
- **Type**: RSS
- **URL**: https://techcrunch.com/feed/
- **Category**: tech

### The Verge
- **Name**: The Verge
- **Type**: RSS
- **URL**: https://www.theverge.com/rss/index.xml
- **Category**: tech

## General News

### BBC News
- **Name**: BBC News
- **Type**: RSS
- **URL**: http://feeds.bbci.co.uk/news/rss.xml
- **Category**: general

### NPR News
- **Name**: NPR News
- **Type**: RSS
- **URL**: https://feeds.npr.org/1001/rss.xml
- **Category**: general

## Testing Steps

1. Go to http://localhost:5176/admin/sources
2. Click "Add Source"
3. Fill in the form with one of the sources above
4. Click "Create Source"
5. Click "Test" to preview articles without saving
6. Click "Fetch" to actually fetch and save articles
7. View the Emulator UI at http://localhost:4000 to see:
   - Functions being called (Functions tab)
   - Articles being saved (Firestore tab)
   - Logs (Logs tab)
