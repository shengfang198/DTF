import { useState } from "react";
import { scrapeUrl } from "./api";

const LandingPage = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setScrapedData(null);

    try {
      const data = await scrapeUrl(url);
      setScrapedData(data);
      console.log("Scraped data:", data);
    } catch (err) {
      console.error("Scrape error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Discover amazing possibilities and join our community today.
          Experience innovation like never before.
        </p>

        {/* Input Container */}
        <div className="max-w-md mx-auto mb-8">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4"
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Link Here"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Scraping..." : "SCRAPE"}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Scraped Data Display */}
          {scrapedData && (
            <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scraped Data
              </h3>
              <div className="space-y-3">
                {scrapedData.title && (
                  <div>
                    <span className="font-medium text-gray-700">Title:</span>{" "}
                    {scrapedData.title}
                  </div>
                )}
                {scrapedData.metaTitle && (
                  <div>
                    <span className="font-medium text-gray-700">Meta Title:</span>{" "}
                    {scrapedData.metaTitle}
                  </div>
                )}
                {scrapedData.metaDescription && (
                  <div>
                    <span className="font-medium text-gray-700">Meta Description:</span>{" "}
                    {scrapedData.metaDescription}
                  </div>
                )}
                {scrapedData.h1 && (
                  <div>
                    <span className="font-medium text-gray-700">H1:</span>{" "}
                    {scrapedData.h1}
                  </div>
                )}
                {scrapedData.headings && scrapedData.headings.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Headings:</span>{" "}
                    {scrapedData.headings.slice(0, 3).join(" | ")}
                  </div>
                )}
                {scrapedData.links && scrapedData.links.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Links:</span>
                    <ul className="mt-1 list-disc list-inside text-sm text-gray-600 max-h-32 overflow-y-auto">
                      {scrapedData.links.slice(0, 5).map((link, index) => (
                        <li key={index}>
                          <a
                            href={link.href}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {link.text || link.href}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default LandingPage;
