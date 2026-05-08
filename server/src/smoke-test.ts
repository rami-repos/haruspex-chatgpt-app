import { HaruspexApiClient } from "./api-client.js";
import { loadConfig } from "./config.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function main() {
  const config = loadConfig();
  const client = new HaruspexApiClient({
    apiBaseUrl: config.apiBaseUrl,
    apiKey: config.apiKey,
  });

  const singleSymbol = process.env.HARUSPEX_SMOKE_SYMBOL?.trim() || "NVDA";
  const watchlist = (process.env.HARUSPEX_SMOKE_WATCHLIST || "NVDA,AAPL,MSFT")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
  const searchQuery = process.env.HARUSPEX_SMOKE_QUERY?.trim() || "NVIDIA";
  const thesis =
    process.env.HARUSPEX_SMOKE_THESIS?.trim() ||
    "AI demand and competitive positioning should continue supporting the business.";

  console.log("Running Haruspex smoke test...");
  console.log(JSON.stringify({ apiBaseUrl: config.apiBaseUrl, singleSymbol, watchlist, searchQuery }, null, 2));

  const search = await client.searchStocks(searchQuery);
  assert(search.kind === "stock-search", "searchStocks returned wrong kind");
  assert(Array.isArray(search.matches), "searchStocks matches is not an array");
  console.log("searchStocks ok: " + search.matches.length + " matches");

  const analysis = await client.analyzeStock(singleSymbol, true);
  assert(analysis.kind === "stock-analysis", "analyzeStock returned wrong kind");
  assert(isNonEmptyString(analysis.symbol), "analyzeStock missing symbol");
  assert(typeof analysis.score === "number", "analyzeStock missing numeric score");
  assert(Array.isArray(analysis.positives), "analyzeStock positives is not an array");
  assert(Array.isArray(analysis.watch), "analyzeStock watch is not an array");
  assert(isNonEmptyString(analysis.trajectorySummary), "analyzeStock missing trajectory summary");
  console.log("analyzeStock ok: " + analysis.symbol + " " + analysis.score + "/100 " + analysis.outlook);

  const review = await client.reviewWatchlist(watchlist);
  assert(review.kind === "watchlist-review", "reviewWatchlist returned wrong kind");
  assert(Array.isArray(review.rows), "reviewWatchlist rows is not an array");
  assert(review.rows.length + review.missingSymbols.length > 0, "reviewWatchlist returned no covered or missing symbols");
  console.log("reviewWatchlist ok: " + review.rows.length + " covered, " + review.missingSymbols.length + " missing");

  const tracked = await client.trackInvestmentThesis(singleSymbol, thesis);
  assert(tracked.kind === "thesis-tracker", "trackInvestmentThesis returned wrong kind");
  assert(isNonEmptyString(tracked.verdict), "trackInvestmentThesis missing verdict");
  assert(Array.isArray(tracked.alignedDimensions), "trackInvestmentThesis alignedDimensions is not an array");
  assert(Array.isArray(tracked.contradictoryDimensions), "trackInvestmentThesis contradictoryDimensions is not an array");
  console.log("trackInvestmentThesis ok: " + tracked.symbol + " verdict=" + tracked.verdict);

  console.log("\nSmoke test summary");
  console.log(JSON.stringify({
    searchMatches: search.matches.slice(0, 3),
    analysis: {
      symbol: analysis.symbol,
      score: analysis.score,
      outlook: analysis.outlook,
      shareUrl: analysis.shareUrl,
    },
    watchlistTopRows: review.rows.slice(0, 3),
    thesis: {
      symbol: tracked.symbol,
      verdict: tracked.verdict,
      shareUrl: tracked.shareUrl,
      alignedDimensions: tracked.alignedDimensions.map((item) => ({ label: item.label, score: item.score, change: item.change })),
      contradictoryDimensions: tracked.contradictoryDimensions.map((item) => ({ label: item.label, score: item.score, change: item.change })),
    },
  }, null, 2));
}

main().catch((error) => {
  console.error("Smoke test failed.");
  console.error(error);
  process.exit(1);
});
