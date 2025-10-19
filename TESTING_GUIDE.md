# Testing Guide - Text Extraction & Summarization

## ✅ Deployment Complete!

All systems deployed successfully:
- ✅ 17 Firebase Functions deployed (including new `testTextExtraction`)
- ✅ Frontend deployed with testing UI
- ✅ Text extraction pipeline integrated into daily fetch job

**Live URL:** https://tribune-50450.web.app

---

## Testing Checklist

### Part 1: Manual Testing in Admin UI

#### 1. Access Articles Browser
1. Go to: https://tribune-50450.web.app/admin/articles
2. Log in if prompted
3. You should see your existing articles

#### 2. Test Text Extraction on Individual Article
1. Find any article in the list
2. Click the **"▶ Test Extraction"** button next to the article
3. The testing panel will expand below the article

#### 3. Run Extraction Test
1. The article URL should be pre-filled
2. Click **"Test Extraction"** button (blue button in the tester panel)
3. Wait 2-5 seconds for results

#### 4. Verify Results
**If successful, you'll see:**
- ✅ Green "Extraction Successful" banner
- **Stats:**
  - Word Count (e.g., 500 words)
  - Paragraphs (e.g., 15 paragraphs)
  - Method: "extractive"
- **Generated Summary:** 1-2 sentence summary in blue box
- **Extracted Text:** First 500 characters of full text

**Example:**
```
✅ Extraction Successful

Word Count: 487
Paragraphs: 12
Method: extractive

Generated Summary:
"Apple unveiled the iPhone 16 featuring a revolutionary A18 chip 
that's 40% faster and a 48MP camera with AI processing. Pre-orders 
begin Friday with prices starting at $999."

Extracted Text:
"Apple today announced the highly anticipated iPhone 16 at a 
special event held at the company's Cupertino headquarters..."
```

#### 5. Test Multiple Articles
- Try testing 3-5 different articles from various sources
- Note which sources work well vs which fail
- Some sites may fail due to paywalls, complex layouts, etc.

---

### Part 2: Testing the Automated Pipeline

#### 1. Trigger Full Fetch Job
1. Go to: https://tribune-50450.web.app/admin
2. Click the **"Fetch All"** button in the dashboard
3. This will trigger the full pipeline including text extraction

#### 2. Monitor Progress
1. The fetch will take longer than before (15-45 seconds depending on article count)
2. Wait for the success alert
3. Should show: "Fetch completed! Articles fetched: X"

#### 3. Check Firestore for New Data
1. Go to: https://console.firebase.google.com/project/tribune-50450/firestore
2. Navigate to: `articles` collection
3. Click on any recently fetched article
4. **Verify new fields exist:**
   - `fullText` (string) - should contain long article text
   - `extractedSummary` (string) - should contain 1-2 sentence summary
   - `summarizedAt` (timestamp) - when summary was generated
   - `summarizationMethod` (string) - should be "extractive"
   - `wordCount` (number) - word count of full text

**Example Firestore Document:**
```json
{
  "id": "abc123",
  "title": "Apple Announces iPhone 16",
  "url": "https://example.com/article",
  "summary": "Apple announced new iPhone...",  // From RSS
  "extractedSummary": "Apple unveiled the iPhone 16 featuring...",  // NEW
  "fullText": "Apple today announced...",  // NEW
  "wordCount": 487,  // NEW
  "summarizationMethod": "extractive",  // NEW
  "summarizedAt": "2025-10-19T..."  // NEW
}
```

#### 4. View Summaries on Front Page
1. Go to: https://tribune-50450.web.app
2. Scroll through articles
3. **Look for improved summaries** under article titles
4. Articles with `extractedSummary` should show better, more specific summaries

**Before (RSS summary):**
> "Apple announces new iPhone with new features."

**After (extracted summary):**
> "Apple unveiled the iPhone 16 featuring a revolutionary A18 chip that's 40% faster and a 48MP camera with AI processing. Pre-orders begin Friday with prices starting at $999."

#### 5. Check Extraction Success Rate
1. Go back to: https://tribune-50450.web.app/admin/articles
2. Scroll through the articles
3. **Look for green badges** showing "✓ Text extracted (XXX words)"
4. **Target success rate:** 70-90% of articles should have extracted text

---

### Part 3: Monitor Function Logs

#### 1. Check Function Logs
```bash
firebase functions:log --only manualFetchAll
```

**OR** via Firebase Console:
1. Go to: https://console.firebase.google.com/project/tribune-50450/functions/logs
2. Filter by function: `manualFetchAll`
3. Look for recent logs

#### 2. Look for These Log Entries

**Text Extraction Start:**
```
Extracting text and generating summaries for 15 articles
```

**Individual Article Success:**
```
Enriched article: "Article Title"
  wordCount: 487
  summaryLength: 156
```

**Extraction Complete Summary:**
```
Text extraction complete
  total: 15
  withText: 12     ← Success count
  withSummary: 12  ← Summary count
```

**Final Processing:**
```
Successfully processed SourceName
  fetched: 15
  normalized: 15
  enriched: 12     ← How many got extracted summaries
  saved: 15
```

#### 3. Identify Issues
**If extraction fails for some articles:**
```
WARN: Text extraction failed for: "Article Title"
  url: https://example.com/article
  error: "Timeout after 15s"
```

Common reasons:
- Site too slow (timeout)
- Paywall/login required
- Unusual site structure
- Dynamic content (JavaScript-only)

---

### Part 4: Quality Assessment

#### Test Different Article Types

**1. Breaking News (Best Performance)**
- News sites like BBC, Reuters, AP News
- Usually work great (inverted pyramid structure)
- Summaries are very accurate

**2. Tech News (Good Performance)**
- TechCrunch, The Verge, Ars Technica
- Good success rate, clear article structure
- Summaries capture key details

**3. Opinion Pieces (Variable)**
- May work but summaries might miss main argument
- First sentences often setup, not thesis
- Still useful for preview

**4. Blog Posts (Variable)**
- Success depends on blog platform
- Well-structured blogs work well
- Personal blogs may have noise

#### Quality Checklist

For each tested article, verify:
- [ ] Full text extracted without too much noise
- [ ] Summary captures key information
- [ ] Summary is readable and coherent
- [ ] Summary length is appropriate (80-200 chars)
- [ ] No extraction of navigation/ads/comments

---

### Part 5: Expected Results

#### Success Metrics

**Good Performance:**
- ✅ 80%+ of articles have extracted text
- ✅ 80%+ of articles have generated summaries
- ✅ Summaries are relevant and informative
- ✅ No fetch failures due to extraction errors
- ✅ Front page shows improved article previews

**Acceptable Performance:**
- ✅ 60%+ of articles have extracted text
- ✅ Front page shows mix of extracted and RSS summaries
- ✅ Fetch job completes without critical errors

**Needs Tuning:**
- ⚠️ <60% extraction success rate
- ⚠️ Many timeouts or errors
- ⚠️ Summaries contain noise/irrelevant text
- ⚠️ Fetch job fails to complete

---

## Troubleshooting

### Problem: Test button doesn't appear

**Check:**
- Are you on `/admin/articles` page?
- Are you logged in?
- Refresh the page

### Problem: "Test Extraction" fails immediately

**Check:**
- Check browser console for errors
- Verify you're authenticated
- Try a different article URL

### Problem: Extraction times out

**This is normal for some sites:**
- Sites that are very slow
- Sites behind CDNs with rate limiting
- Sites that require JavaScript

**Not a critical issue:** Pipeline continues with other articles

### Problem: Low extraction success rate

**Solutions:**
1. Check which sources are failing (look at logs)
2. Those sources might need site-specific tuning
3. For now, RSS summaries will be used as fallback
4. Can be improved later with custom selectors

### Problem: Summaries contain noise

**Example:** "Subscribe to our newsletter Click here for more"

**Solution:** The extraction filters need tuning for that specific site. This can be added to `textExtractor.ts` junk patterns.

### Problem: Fetch job takes too long

**Expected:** 
- Before: ~1-2 seconds per source
- After: ~15-30 seconds per source (with extraction)

**This is normal** since we're:
1. Fetching article URLs
2. Fetching full article HTML for each
3. Extracting text
4. Generating summaries

**Still acceptable** since it runs once every 12 hours.

---

## Next Steps After Testing

### If Everything Works Well ✅

1. **Let it run** - The scheduled job will run every 12 hours automatically
2. **Monitor** - Check Firestore daily to see extraction success rates
3. **Collect data** - After a week, review which sources work best
4. **Consider AI upgrade** - If you want even better quality, implement Gemini

### If You See Issues ⚠️

1. **Document failures** - Note which article URLs fail
2. **Check patterns** - Are certain sources failing consistently?
3. **Tune extraction** - We can add site-specific rules
4. **Adjust timeouts** - Can increase from 15s to 30s if needed

### Future Enhancements 🔮

Once you're comfortable with extractive summarization:

**Week 2-3:** 
- Collect metrics on extraction success rates
- Fine-tune for problematic sources

**Month 2:**
- Evaluate summary quality
- Consider upgrading to AI (Gemini) if needed
- Implement selective extraction (only for articles without good RSS summaries)

---

## Testing Commands Quick Reference

```bash
# View function logs
firebase functions:log --only manualFetchAll

# View specific function logs
firebase functions:log --only testTextExtraction

# Deploy functions only
firebase deploy --only functions

# Deploy hosting only
firebase deploy --only hosting

# Deploy both
firebase deploy --only functions,hosting
```

---

## Admin URLs

- **Dashboard:** https://tribune-50450.web.app/admin
- **Articles Browser (Testing):** https://tribune-50450.web.app/admin/articles
- **Sources Manager:** https://tribune-50450.web.app/admin/sources
- **Settings:** https://tribune-50450.web.app/admin/settings

---

## What To Test Right Now

1. ✅ **Go to Articles Browser** and test 3-5 articles
2. ✅ **Trigger a manual fetch** from dashboard
3. ✅ **Check Firestore** for new fields
4. ✅ **View front page** to see summaries
5. ✅ **Monitor function logs** for any errors

**Time needed:** 10-15 minutes

**Ready to test!** Start with the Articles Browser: https://tribune-50450.web.app/admin/articles

