import { useState, useEffect } from "react";
import { scrapeUrl, getAllScrapedData } from "./api";

const LandingPage = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [allScrapedData, setAllScrapedData] = useState([]);
  const [error, setError] = useState("");

  const handleDownloadCsv = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/download-csv');
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'scraped_data.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download CSV: ' + err.message);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const data = await getAllScrapedData();
        setAllScrapedData(data);
      } catch (err) {
        console.error("Failed to load all scraped data:", err);
        setAllScrapedData([]);
      }
    };
    loadAllData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setScrapedData(null);

    try {
      const data = await scrapeUrl(url);
      setScrapedData(data);
      console.log("Scraped data:", data);
      // Refresh all scraped data
      try {
        const allData = await getAllScrapedData();
        setAllScrapedData(allData);
      } catch (refreshErr) {
        console.error("Failed to refresh data:", refreshErr);
        setAllScrapedData([]);
      }
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

      {/* All Scraped Data Table */}
      {allScrapedData.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              All Scraped Data
            </h2>
            <button
              onClick={handleDownloadCsv}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    H1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Links Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allScrapedData
                  .filter(data => data && typeof data === 'object' && 'url' in data)
                  .map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a
                          href={data.url}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          title={data.url}
                        >
                          {data.url.length > 50
                            ? `${data.url.substring(0, 50)}...`
                            : data.url}
                        </a>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate"
                        title={data.title}
                      >
                        {data.title}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate"
                        title={data.h1}
                      >
                        {data.h1}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
                        title={data.metaDescription}
                      >
                        {data.metaDescription}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(data.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {data.links && Array.isArray(data.links) && data.links.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {data.links.slice(0, 3).map(link => (
                              <li key={link.href}>
                                <a href={link.href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                  {link.href.length > 30 ? `${link.href.substring(0, 30)}...` : link.href}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No links found</p>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
