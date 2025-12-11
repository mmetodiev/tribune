/**
 * Example Server Implementation for Article Extraction
 * 
 * This is a reference implementation for deploying to Heroku or Ubuntu server.
 * To use this:
 * 1. Copy this file to your server project
 * 2. Install dependencies: npm install express @mozilla/readability jsdom axios
 * 3. Set up Express server
 * 4. Deploy to Heroku/Ubuntu
 * 
 * Then set VITE_ARTICLE_EXTRACTOR_URL in your frontend .env to point to this server.
 */

import express from 'express';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import axios from 'axios';

const app = express();
app.use(express.json());

// CORS middleware (adjust origins as needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

/**
 * Extract article content endpoint
 * POST /api/extract-article
 * Body: { url: string }
 */
app.post('/api/extract-article', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Fetch article HTML
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TribuneBot/1.0; +https://tribune.news/bot)',
      },
      maxRedirects: 5,
    });

    const html = response.data;
    const finalUrl = response.request?.res?.responseUrl || url;

    // Create virtual DOM with JSDOM
    const dom = new JSDOM(html, { url: finalUrl });

    // Parse with Readability
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return res.status(422).json({
        success: false,
        error: 'Unable to extract readable content from this article',
      });
    }

    // Return parsed article data
    res.json({
      success: true,
      url: finalUrl,
      title: article.title,
      byline: article.byline,
      excerpt: article.excerpt,
      content: article.content, // HTML content
      textContent: article.textContent, // Plain text
      length: article.length,
      siteName: article.siteName,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Article extraction failed:', errorMessage);
    
    res.status(500).json({
      success: false,
      error: `Failed to fetch article: ${errorMessage}`,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Article extractor server running on port ${PORT}`);
});

