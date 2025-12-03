const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvParser = require('csv-parser');
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// User agents for rotation (legal scraping)
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebGit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
];

// Scrape single page
const scrapePage = async (browser, url) => {
  try {
    const page = await browser.newPage();
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUA);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const html = await page.content();
    await page.close();

    console.log('Scraped:', url, 'HTML length:', html.length);

    const $ = cheerio.load(html);

    console.log('Parsed elements:');
    console.log('Body length:', $('body').text().length);
    console.log('All elements:', $.root().children().length);
    console.log('Divs:', $('div').length);
    console.log('Scripts:', $('script').length);

    const scrapedData = {
      title: $('title').text().trim(),
      metaDescription: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      metaTitle: $('meta[property="og:title"]').attr('content') || '',
      h1: $('h1').first().text().trim(),
      headings: $('h1, h2, h3, h4, h5, h6').map((i, el) => $(el).text().trim()).get().slice(0, 10),
      paragraphs: $('p').map((i, el) => $(el).text().trim()).get().slice(0, 5),
      lists: $('ul li').map((i, el) => $(el).text().trim()).get().slice(0, 5),
      bodyText: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 1000), // Main text content
      links: $('a[href]').map((i, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr('href')
      })).get().slice(0, 5), // Limit to 5 links
      images: $('img[src]').map((i, el) => $(el).attr('src')).get().slice(0, 5)
    };

    console.log('Extracted data sample:');
    console.log('Title:', scrapedData.title?.substring(0, 100));
    console.log('Links count:', scrapedData.links.length);
    console.log('BodyText length:', scrapedData.bodyText.length);

    // Determine status
    let status = "SUCCESS";
    const hasData = scrapedData.title || scrapedData.headings.length > 0 || scrapedData.bodyText.length > 0 || scrapedData.metaDescription || scrapedData.metaTitle;

    if (scrapedData.links.length === 0 && hasData) {
      status = "PARTIAL";
    }

    // Detect blocked sites
    const blockedKeywords = ['incapsula', 'cloudflare', 'blocked', 'access denied'];
    if (blockedKeywords.some(keyword => html.toLowerCase().includes(keyword))) {
      status = "BLOCKED";
    }

    // Only skip if no data at all and not blocked
    const shouldSkip = !hasData && html.length < 2000;
    if (shouldSkip && status !== "BLOCKED") {
      console.log('Skipping empty site:', url, 'but extracting links');
      return { skipped: true, links: scrapedData.links };
    }

    // Detect next page link for pagination
    let nextUrl = null;
    $('a[href]').each((i, el) => {
      const text = $(el).text().toLowerCase().trim();
      const href = $(el).attr('href');
      const className = $(el).attr('class') || '';
      if (
        (text.includes('next') || text.includes('>') && href) ||
        className.includes('next') ||
        href?.includes('?page=') ||
        href?.includes('&page=') ||
        href?.includes('/page/')
      ) {
        try {
          const absoluteUrl = new URL(href, url);
          nextUrl = absoluteUrl.href;
          return false; // Break
        } catch {}
      }
    });

    return { ...scrapedData, nextUrl, status };
  } catch (error) {
    console.error('Error scraping', url, ':', error.message);
    return null;
  }
};

// Scraping endpoint with crawling
app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const processed = new Set();
    const queue = [url];
    const maxPages = 500;

    const csvWriter = createCsvWriter({
      path: 'scraped_data.csv',
      header: [
        { id: 'url', title: 'url' },
        { id: 'title', title: 'title' },
        { id: 'h1', title: 'h1' },
        { id: 'metaDescription', title: 'metaDescription' },
        { id: 'metaTitle', title: 'metaTitle' },
        { id: 'links', title: 'links' },
        { id: 'images', title: 'images' },
        { id: 'bodyText', title: 'bodyText' },
        { id: 'status', title: 'status' },
        { id: 'scraped_at', title: 'scraped_at' }
      ],
      append: true
    });

    const records = [];

    while (queue.length > 0 && processed.size < maxPages) {
      const currentUrl = queue.shift();
      if (processed.has(currentUrl)) continue;

      processed.add(currentUrl);
      const pageData = await scrapePage(browser, currentUrl);

      // Prepare record data
      let recordData;

      if (pageData) {
        if (!pageData.skipped) {
          recordData = {
            url: currentUrl,
            title: pageData.title || '',
            h1: pageData.h1 || '',
            metaDescription: pageData.metaDescription || '',
            metaTitle: pageData.metaTitle || '',
            links: JSON.stringify(pageData.links),
            images: JSON.stringify(pageData.images),
            bodyText: pageData.bodyText || '',
            status: pageData.status || 'SUCCESS',
            scraped_at: new Date().toISOString()
          };

          // Add pagination next page if found
          if (pageData.nextUrl && pageData.nextUrl !== currentUrl && !processed.has(pageData.nextUrl) && !queue.includes(pageData.nextUrl)) {
            queue.push(pageData.nextUrl);
          }
        }
      } else {
        // Error occurred
        recordData = {
          url: currentUrl,
          title: '',
          h1: '',
          metaDescription: '',
          metaTitle: '',
          links: JSON.stringify([]),
          images: JSON.stringify([]),
          bodyText: '',
          status: 'ERROR',
          scraped_at: new Date().toISOString()
        };
      }

      // Save record if it's not skipped
      if (recordData) {
        records.push(recordData);
      }

      // Add links from all pages (including skipped) to queue for potential scraping
      if (pageData) {
        const linksToProcess = pageData.links;
        if (linksToProcess && Array.isArray(linksToProcess)) {
          const baseUrl = new URL(url).hostname;
          linksToProcess.forEach(link => {
            try {
              const linkUrl = new URL(link.href, currentUrl);
              if (linkUrl.hostname === baseUrl && !processed.has(linkUrl.href) && !queue.includes(linkUrl.href)) {
                queue.push(linkUrl.href);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          });
        }
      }
    }

    await browser.close();

    if (records.length > 0) {
      await csvWriter.writeRecords(records);
    }

    res.json({ message: `Scraped ${records.length} pages`, data: records[0] });
  } catch (error) {
    console.error('Scraping error:', error.message);
    res.status(500).json({ error: 'Failed to scrape', details: error.message });
  }
});

// Get all scraped data
app.get('/api/scraped-data', (req, res) => {
  const results = [];
  if (!fs.existsSync('scraped_data.csv')) {
    return res.json({ data: [] });
  }

  fs.createReadStream('scraped_data.csv')
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Parse JSON strings back to objects
      const parsed = [];
      for (const row of results) {
        try {
          parsed.push({
            ...row,
            headings: JSON.parse(row.headings || '[]'),
            paragraphs: JSON.parse(row.paragraphs || '[]'),
            lists: JSON.parse(row.lists || '[]'),
            content: row.content || '',
            links: JSON.parse(row.links || '[]'),
            images: JSON.parse(row.images || '[]')
          });
        } catch (e) {
          console.warn('Skipping bad row:', row, e.message);
        }
      }
      res.json({ data: parsed });
    })
    .on('error', (error) => {
      console.error('CSV read error:', error);
      res.status(500).json({ error: 'Failed to read CSV data' });
    });
});

// Download CSV
app.get('/api/download-csv', (req, res) => {
  const csvPath = 'scraped_data.csv';
  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: 'No CSV data available' });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="scraped_data.csv"');
  const fileStream = fs.createReadStream(csvPath);
  fileStream.pipe(res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
