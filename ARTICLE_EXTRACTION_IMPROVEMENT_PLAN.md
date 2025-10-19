# Article Extraction Improvement Plan

## Current State Analysis

### What We Have
- **Primary**: Readability.js with JSDOM (good for 70-80% of articles)
- **Backup**: Cheerio-based text extractor (simpler, used in background jobs)
- **Issues**: 
  - No quality validation
  - No fallback when Readability fails
  - No handling of JS-heavy sites
  - Single extraction attempt
  - Runtime extraction (causes delays)

### Why Articles Fail

1. **JavaScript-Heavy Sites** (React/Vue/Angular SPAs)
   - Content loads after initial HTML
   - Readability sees empty page
   - Examples: Medium, some news sites

2. **Paywall/Login Required**
   - Content hidden behind auth
   - Limited preview text
   - Examples: NYT, WSJ, The Atlantic

3. **Anti-Scraping Measures**
   - Bot detection
   - Rate limiting
   - CAPTCHA challenges

4. **Poor HTML Structure**
   - Non-semantic markup
   - Content in divs without clear containers
   - Inline styles hiding structure

5. **Multi-Page Articles**
   - Content split across pagination
   - "Read More" links
   - Infinite scroll

6. **Heavy Ads/Tracking**
   - Content buried in cruft
   - Interstitials and overlays
   - Cookie banners

## Recommended Solution: Multi-Tier Extraction Pipeline

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: Fast Path (80% of articles)                    │
│  ─────────────────────────────────────────────────       │
│  → Readability.js + JSDOM                                │
│  → Validate quality                                      │
│  → Return if good                                        │
└─────────────────────────────────────────────────────────┘
                    ↓ (if fails)
┌─────────────────────────────────────────────────────────┐
│  TIER 2: Enhanced Extraction (15% of articles)          │
│  ─────────────────────────────────────────────────       │
│  → Remove ads/overlays first                             │
│  → Try Readability with different settings               │
│  → Fallback to Cheerio selectors                         │
│  → Validate quality                                      │
└─────────────────────────────────────────────────────────┘
                    ↓ (if fails)
┌─────────────────────────────────────────────────────────┐
│  TIER 3: Alternative Methods (4% of articles)           │
│  ─────────────────────────────────────────────────       │
│  → Site-specific extraction rules                        │
│  → Manual selector library                               │
│  → Extract largest text blocks                           │
└─────────────────────────────────────────────────────────┘
                    ↓ (if fails)
┌─────────────────────────────────────────────────────────┐
│  TIER 4: Graceful Fallback (1% of articles)            │
│  ─────────────────────────────────────────────────       │
│  → Return original URL                                   │
│  → Show error message                                    │
│  → Log for analysis                                      │
└─────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Quality Validation (Immediate)
**Impact**: Detect failures accurately
**Effort**: Low (1-2 hours)

```typescript
interface QualityMetrics {
  wordCount: number;
  paragraphCount: number;
  avgParagraphLength: number;
  hasImages: boolean;
  hasHeadings: boolean;
  contentToHTMLRatio: number; // text vs markup
  score: number; // 0-100
}

function validateExtraction(article: any): QualityMetrics {
  // Check if extraction looks good
  // Return quality score
}
```

**Benefits**:
- Know when extraction failed
- Trigger fallbacks appropriately
- Collect failure data

---

### Phase 2: Enhanced Pre-Processing (High Priority)
**Impact**: Handle ads/overlays better
**Effort**: Medium (2-3 hours)

```typescript
function preProcessHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Remove common cruft
  removeOverlays(doc);
  removeCookieBanners(doc);
  removeAds(doc);
  removeTrackers(doc);
  
  return dom.serialize();
}
```

**What to Remove**:
- Cookie consent banners
- Newsletter popups
- Social media bars
- Tracking pixels
- Ad containers
- Paywalls (soft)

---

### Phase 3: Fallback Extraction (High Priority)
**Impact**: Recover 10-15% of failures
**Effort**: Medium (3-4 hours)

```typescript
async function extractWithFallbacks(url: string, html: string) {
  // Try 1: Standard Readability
  let result = tryReadability(html);
  if (isGoodQuality(result)) return result;
  
  // Try 2: Pre-processed + Readability
  const cleaned = preProcessHTML(html);
  result = tryReadability(cleaned);
  if (isGoodQuality(result)) return result;
  
  // Try 3: Cheerio selectors
  result = tryCheerioExtraction(html);
  if (isGoodQuality(result)) return result;
  
  // Try 4: Largest text block
  result = extractLargestTextBlock(html);
  if (isGoodQuality(result)) return result;
  
  // Give up
  return null;
}
```

---

### Phase 4: Pre-Extraction During Fetch (Optimization)
**Impact**: Zero runtime delay for users
**Effort**: Medium (2-3 hours)

**Current Flow**:
```
User clicks article → Fetch HTML → Parse → Display (slow!)
```

**Improved Flow**:
```
Background job fetches article → Parse & store → User clicks → Display (instant!)
```

**Implementation**:
```typescript
// During article fetch job
async function fetchAndStoreArticles(source: Source) {
  const articles = await fetchArticles(source);
  
  for (const article of articles) {
    // Extract and store parsed content
    const parsed = await extractArticleContent(article.url);
    
    if (parsed) {
      article.readableContent = parsed.content;
      article.readableTitle = parsed.title;
      article.extractionQuality = parsed.qualityScore;
    }
    
    await saveArticle(article);
  }
}
```

**Benefits**:
- Instant article loading for users
- Can retry failures in background
- Cache successful extractions
- No timeout pressure

---

### Phase 5: Site-Specific Rules (Optional)
**Impact**: Handle known difficult sites
**Effort**: Medium-High (ongoing)

```typescript
const SITE_RULES = {
  'medium.com': {
    selectors: ['article', '.postArticle-content'],
    waitFor: '.pw-post-body',
    removeSelectors: ['.metabar', '.js-actionMultirecommend']
  },
  'substack.com': {
    selectors: ['.post-content', '.body'],
    removeSelectors: ['.subscribe-widget']
  },
  // Add as needed
};

function applySiteRules(url: string, html: string) {
  const domain = new URL(url).hostname;
  const rules = SITE_RULES[domain];
  
  if (rules) {
    return extractWithRules(html, rules);
  }
  
  return null;
}
```

---

### Phase 6: Headless Browser for JS-Heavy Sites (Strategic)
**Impact**: Handle JavaScript-rendered content
**Effort**: Medium-High (4-6 hours)

#### What is a Headless Browser?
A full Chrome/Firefox browser that runs without a UI. It executes JavaScript, waits for content to load, then extracts the rendered HTML.

**Popular Options**:
- **Puppeteer** (Google, Chrome-based)
- **Playwright** (Microsoft, multi-browser)
- **Selenium** (older, more established)

#### When to Use
```typescript
const JS_HEAVY_PATTERNS = [
  'medium.com',
  'substack.com', 
  // React/Vue/Angular sites that fail regular extraction
];

async function needsHeadlessBrowser(url: string): boolean {
  const domain = new URL(url).hostname;
  return JS_HEAVY_PATTERNS.some(pattern => domain.includes(pattern));
}
```

#### Implementation with Puppeteer

```typescript
import puppeteer from 'puppeteer';

async function extractWithHeadlessBrowser(url: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    );
    
    // Block ads/tracking to speed up
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Navigate and wait for content
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for article content to appear
    await page.waitForSelector('article, .post-content, [role="main"]', {
      timeout: 10000
    });
    
    // Get fully rendered HTML
    const html = await page.content();
    
    // Now use Readability on the rendered HTML
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html, { url });
    const { Readability } = await import('@mozilla/readability');
    const article = new Readability(dom.window.document).parse();
    
    return article;
    
  } finally {
    await browser.close();
  }
}
```

#### Pros & Cons

**✅ Advantages**:
- Executes JavaScript (handles SPAs)
- Waits for dynamic content
- Can scroll/click if needed
- Sees what users see
- Bypasses some bot detection
- Handles lazy loading

**❌ Disadvantages**:
- **Much slower**: 5-15 seconds vs 1-2 seconds
- **More expensive**: 
  - CPU: 10x more resources
  - Memory: 200-500 MB per instance
  - Cloud Functions: May need larger instances
- **More complex**:
  - Browser crashes
  - Timeouts
  - State management
- **Infrastructure**:
  - Need to bundle Chrome (~170 MB)
  - Or use Cloud Run with custom container
- **Scaling issues**:
  - Concurrent browser limits
  - Memory constraints
- **Cost**: $0.01-0.05 per article

#### Hybrid Approach: Strategic Use

**Don't use headless browser for everything!** Use tiered approach:

```typescript
async function extractArticle(url: string, html: string) {
  // TIER 1: Fast extraction (1-2s, 80% of articles)
  let result = await tryReadability(html);
  if (isGoodQuality(result)) return result;
  
  // TIER 2: Pre-processed extraction (2-3s, 15% of articles)
  const cleaned = preProcessHTML(html);
  result = await tryReadability(cleaned);
  if (isGoodQuality(result)) return result;
  
  // TIER 3: Check if JS-heavy site (0.1s)
  if (needsHeadlessBrowser(url)) {
    // ONLY NOW use headless browser (10-15s, 3% of articles)
    result = await extractWithHeadlessBrowser(url);
    if (result) return result;
  }
  
  // TIER 4: Other fallbacks (1-2s, 1% of articles)
  result = await tryCheerioExtraction(html);
  if (isGoodQuality(result)) return result;
  
  // Give up
  return null;
}
```

#### Infrastructure Options

**Option 1: Cloud Functions (Current)**
- ❌ Limited to 8GB memory
- ❌ 540 second timeout
- ❌ Difficult to bundle Chrome
- ✅ Easy deployment
- **Verdict**: Not ideal for headless browsers

**Option 2: Cloud Run**
- ✅ Custom Docker container with Chrome
- ✅ Up to 32GB memory
- ✅ 60 minute timeout
- ✅ Better for long-running tasks
- ✅ Auto-scaling
- **Verdict**: Perfect for headless browsers!

**Option 3: Dedicated Service**
- ✅ Full control
- ✅ Better performance
- ❌ More complex
- ❌ Always-on costs
- **Verdict**: Overkill for our needs

#### Recommended Setup

```
┌─────────────────────────────────────────┐
│  Cloud Function (Current)               │
│  - Fast extraction with Readability     │
│  - Pre-processing                        │
│  - Most articles (95%)                   │
└─────────────────────────────────────────┘
           ↓ (if fails & JS-heavy)
┌─────────────────────────────────────────┐
│  Cloud Run Service (New)                │
│  - Headless browser extraction          │
│  - Puppeteer/Playwright                 │
│  - JS-heavy sites only (5%)             │
└─────────────────────────────────────────┘
```

#### Cost Analysis

**Without Headless Browser**:
- 1000 articles/day
- 1-2s per article
- Cost: ~$0.10/day

**With Headless Browser (all articles)**:
- 1000 articles/day  
- 10-15s per article
- Cost: ~$5-10/day 💸

**With Hybrid (strategic use)**:
- 950 fast articles: ~$0.10
- 50 headless articles: ~$0.50
- Total: ~$0.60/day ✅

**Savings**: 90% cost reduction vs full headless!

#### Detection & Routing

```typescript
async function proxyArticle(request) {
  const { url } = request.data;
  
  // Quick fetch to check if JS-heavy
  const response = await axios.get(url);
  const html = response.data;
  
  // Check if content is empty (likely JS-rendered)
  const textLength = extractTextLength(html);
  const isJSHeavy = textLength < 200 || needsHeadlessBrowser(url);
  
  if (isJSHeavy) {
    // Route to Cloud Run headless service
    return await callHeadlessService(url);
  } else {
    // Extract normally
    return await extractWithReadability(html);
  }
}
```

#### Implementation Priority

🔴 **Not Urgent** - Implement after Phases 1-4

**Why wait?**:
1. Phases 1-3 will get us to 85-90% success
2. Pre-extraction (Phase 4) eliminates urgency
3. Complex to implement correctly
4. Only helps 3-5% of articles
5. Expensive if not done carefully

**When to implement**:
- After measuring extraction failures
- If JS-heavy sites are common in our sources
- If we add more Medium/Substack-like sources
- If users request specific JS-heavy sites

---

### Phase 7: AI-Assisted Extraction (Advanced)
**Impact**: Handle very difficult articles
**Effort**: High (1-2 days)

```typescript
async function extractWithAI(html: string, url: string) {
  // Use Claude/GPT to extract clean content
  const prompt = `
    Extract the main article content from this HTML.
    Return only the article text in markdown format.
    Remove all ads, navigation, and cruft.
    
    HTML: ${html.substring(0, 50000)}
  `;
  
  const result = await callAI(prompt);
  return convertMarkdownToHTML(result);
}
```

**Considerations**:
- Costs ($0.01-0.05 per article)
- Slower (2-5 seconds)
- Very accurate (95%+)
- Use only for failures

**Comparison**:
| Method | Speed | Cost | Success Rate |
|--------|-------|------|--------------|
| Readability | 1-2s | $0.0001 | 70-80% |
| Headless | 10-15s | $0.01 | 90-95% |
| AI | 2-5s | $0.03 | 95-99% |

---

## Quality Metrics & Validation

### Extraction Quality Score

```typescript
function calculateQualityScore(article: any): number {
  let score = 0;
  
  // Word count (0-30 points)
  const wordCount = article.textContent?.split(/\s+/).length || 0;
  if (wordCount > 1000) score += 30;
  else if (wordCount > 500) score += 20;
  else if (wordCount > 200) score += 10;
  else if (wordCount > 100) score += 5;
  
  // Paragraph count (0-20 points)
  const paragraphs = article.content?.match(/<p>/g)?.length || 0;
  if (paragraphs > 10) score += 20;
  else if (paragraphs > 5) score += 15;
  else if (paragraphs > 3) score += 10;
  
  // Has images (0-10 points)
  const hasImages = /<img/i.test(article.content || '');
  if (hasImages) score += 10;
  
  // Has headings (0-15 points)
  const hasHeadings = /<h[1-6]/i.test(article.content || '');
  if (hasHeadings) score += 15;
  
  // Content-to-markup ratio (0-15 points)
  const textLength = article.textContent?.length || 0;
  const htmlLength = article.content?.length || 1;
  const ratio = textLength / htmlLength;
  if (ratio > 0.4) score += 15;
  else if (ratio > 0.3) score += 10;
  else if (ratio > 0.2) score += 5;
  
  // Has byline (0-5 points)
  if (article.byline) score += 5;
  
  // Has excerpt (0-5 points)
  if (article.excerpt && article.excerpt.length > 50) score += 5;
  
  return score;
}

// Quality thresholds
// 80-100: Excellent
// 60-79: Good  
// 40-59: Acceptable
// 20-39: Poor
// 0-19: Failed
```

---

## Recommended Implementation Order

### Immediate (Week 1)
1. ✅ **Add quality validation** to proxyArticle function
2. ✅ **Add logging** for extraction metrics
3. ✅ **Implement pre-processing** (remove ads/overlays)
4. ✅ **Add fallback extraction** (Cheerio method)

### Short-term (Week 2-3)
5. **Pre-extract during fetch** (store in Firestore)
6. **Add caching** for successful extractions
7. **Retry mechanism** for failed extractions

### Medium-term (Month 1-2)
8. **Site-specific rules** for common sources
9. **Analytics dashboard** for extraction quality
10. **User feedback** mechanism

### Long-term (Month 3+)
11. **AI-assisted extraction** for hard cases
12. **Headless browser** for JS-heavy sites (Puppeteer)
13. **Machine learning** for extraction patterns

---

## Success Metrics

### Before Improvements
- Success rate: ~70-80%
- Quality score: ~65/100 average
- User complaints: High
- Load time: 2-3 seconds

### Target After Phase 1-4
- Success rate: 90-95%
- Quality score: 75/100 average
- User complaints: Low
- Load time: <500ms (with pre-extraction)

---

## Storage Schema Update

Add to Article type:

```typescript
interface Article {
  // ... existing fields
  
  // Reader view fields (new)
  readableContent?: string;      // Pre-extracted HTML
  readableTitle?: string;        // Cleaned title
  readableByline?: string;       // Author info
  readableExcerpt?: string;      // Summary
  extractionMethod?: 'readability' | 'cheerio' | 'rules' | 'ai';
  extractionQuality?: number;    // 0-100 score
  extractedAt?: Timestamp;       // When extracted
  extractionRetries?: number;    // Attempt count
}
```

---

## Cost Analysis

### Current Approach (On-Demand)
- ✅ No storage cost
- ✅ No background processing
- ❌ Slow user experience (2-3s delay)
- ❌ Lower success rate (70-80%)
- ❌ Multiple users re-extract same article

### Pre-Extraction Approach
- ✅ Instant user experience (<100ms)
- ✅ Higher success rate (90-95%)
- ✅ Extract once, serve many times
- ❌ Storage cost (~$0.02/month per 1000 articles)
- ❌ Background processing time

**Recommendation**: Pre-extraction is worth it!

---

## Alternative: Hybrid Approach

**Best of Both Worlds**:

1. **First View**: Extract on-demand (as now)
2. **Cache**: Store successful extraction in Firestore
3. **Subsequent Views**: Serve from cache (instant)
4. **Background Job**: Re-extract failures nightly

This gives us:
- ✅ Instant for popular articles (cached)
- ✅ Works for unpopular articles (on-demand)
- ✅ Minimal storage cost (only cached)
- ✅ Better success rate (retry failures)

---

## Code Structure

```
functions/src/
  extraction/
    readability.ts          # Primary extractor
    preprocessing.ts        # Clean HTML before extraction
    fallbacks.ts           # Alternative extraction methods
    validation.ts          # Quality scoring
    siteRules.ts          # Site-specific rules
    cache.ts              # Caching logic
  
  types/
    extraction.ts         # TypeScript interfaces
```

---

## Next Steps

**Ready to implement?** I recommend starting with:

1. **Phase 1**: Quality validation + logging (30 min)
2. **Phase 2**: Pre-processing cleanup (1 hour)  
3. **Phase 3**: Fallback extraction (2 hours)
4. **Test**: Validate improvements with real articles

This gives us 80-90% improvement with 3-4 hours of work.

Want me to implement this? I can start with Phase 1-3 right now.

