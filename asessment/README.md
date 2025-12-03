# Web Scraper Application

A comprehensive web scraping application with frontend and backend components for data extraction and management.

## Features

- Modern web scraping with headless browser support (Puppeteer)
- Intelligent site crawling with pagination detection
- Status tracking (SUCCESS, PARTIAL, BLOCKED, ERROR)
- Data export to CSV
- Clean, responsive React frontend
- RESTful API backend

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Axios for API calls

**Backend:**
- Node.js with Express
- Puppeteer for headless browsing
- Cheerio for HTML parsing
- CSV data storage

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd web-scraper-app
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

## Usage

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

4. Enter a URL to scrape and click "SCRAPE"

## API Endpoints

- `POST /api/scrape` - Start scraping a URL with crawling
- `GET /api/scraped-data` - Get all scraped data
- `GET /api/download-csv` - Download scraped data as CSV

## Configuration

The backend includes configurable user agent rotation and proxy support hooks for enhanced scraping capabilities.

## Legal Note

Ensure compliance with website terms of service and robots.txt when scraping websites. This tool is intended for educational and legitimate data collection purposes.

## License

[Add your license here]
