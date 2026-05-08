import type {
  DimensionScore,
  StockAnalysisResult,
  StockSearchResult,
  ThesisTrackerResult,
  WatchlistReviewResult,
} from "./types.js";
import type {
  BatchApiResult,
  HistoryApiResult,
  NewsApiResult,
  ScoreApiResult,
  SearchApiResult,
} from "./raw-api-types.js";
import { buildThesisSummary, inferVerdict, selectRelevantDimensions } from "./thesis.js";

export function summarizeDimension(label: string, score: number, change: number) {
  const direction = change > 0 ? "improving" : change < 0 ? "weakening" : "steady";
  if (score >= 70) return label + " is a current strength and is " + direction + ".";
  if (score >= 50) return label + " is mixed overall and is " + direction + ".";
  return label + " is a pressure point and is " + direction + ".";
}

export function toDimensionScores(topicScores: ScoreApiResult["topicScores"]): DimensionScore[] {
  return Object.entries(topicScores || {})
    .map(([key, value]) => ({
      key,
      label: value.name,
      score: value.score,
      change: value.change,
      summary: summarizeDimension(value.name, value.score, value.change),
    }))
    .sort((a, b) => b.score - a.score || b.change - a.change);
}

export function buildTrajectorySummary(history: HistoryApiResult) {
  if (!history.scores.length) return "No recent score history is available yet.";
  const first = history.scores[0];
  const last = history.scores[history.scores.length - 1];
  const sorted = [...history.scores].sort((a, b) => a.score - b.score);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  const net = last.score - first.score;
  const direction = net > 1 ? "improved" : net < -1 ? "weakened" : "held roughly steady";
  const move = net > 0 ? "up " + net.toFixed(1) + " points" : net < 0 ? "down " + Math.abs(net).toFixed(1) + " points" : "with no net change";
  return history.symbol + " " + direction + " over the sampled window, moving from " + first.score + "/100 to " + last.score + "/100 (" + move + "). The range was " + low.score + "/100 to " + high.score + "/100 between " + history.from + " and " + history.to + ".";
}

export function adaptSearchResult(query: string, result: SearchApiResult): StockSearchResult {
  return {
    kind: "stock-search",
    query,
    matches: result.results.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchange || undefined,
    })),
  };
}

export function adaptStockAnalysis(
  score: ScoreApiResult,
  history: HistoryApiResult,
  news: NewsApiResult | null
): StockAnalysisResult {
  const dimensions = toDimensionScores(score.topicScores);
  return {
    kind: "stock-analysis",
    symbol: score.symbol,
    companyName: score.companyName,
    score: score.score,
    change: score.change,
    outlook: score.outlook,
    shareUrl: score.shareUrl || ("https://haruspex.guru/search?q=" + encodeURIComponent(score.symbol)),
    positives: dimensions.slice(0, 3),
    watch: dimensions.filter((item) => item.score !== 0 && (item.score < 50 || item.change <= -5)).slice(0, 3),
    trajectorySummary: buildTrajectorySummary(history),
    news: news?.articles.map((article) => ({
      headline: article.title,
      source: article.source,
      publishedAt: article.publishedAt,
      url: article.url,
    })),
  };
}

export function adaptWatchlistReview(symbolsRequested: string[], result: BatchApiResult): WatchlistReviewResult {
  const scored = result.scores.filter((entry): entry is ScoreApiResult => !("error" in entry));
  const missing = result.scores.filter((entry): entry is { symbol: string; error: string } => "error" in entry);

  const rows = scored
    .map((entry) => {
      const dimensions = toDimensionScores(entry.topicScores);
      return {
        symbol: entry.symbol,
        score: entry.score,
        change: entry.change,
        outlook: entry.outlook,
        shareUrl: entry.shareUrl || ("https://haruspex.guru/search?q=" + encodeURIComponent(entry.symbol)),
        topDriver: dimensions[0]?.label,
      };
    })
    .sort((a, b) => b.score - a.score || b.change - a.change);

  const biggestMovers = [...rows]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 3)
    .map((row) => ({
      symbol: row.symbol,
      change: row.change,
      summary: row.symbol + " moved " + (row.change >= 0 ? "up " : "down ") + Math.abs(row.change).toFixed(1) + " points and now sits at " + row.score + "/100.",
    }));

  const flags = scored
    .flatMap((entry) =>
      toDimensionScores(entry.topicScores)
        .filter((dimension) => dimension.score < 35 && dimension.change <= -5)
        .slice(0, 2)
        .map((dimension) => ({
          symbol: entry.symbol,
          dimension: dimension.label,
          score: dimension.score,
          change: dimension.change,
          summary: summarizeDimension(dimension.label, dimension.score, dimension.change),
        }))
    )
    .slice(0, 6);

  return {
    kind: "watchlist-review",
    symbolsRequested,
    rows,
    missingSymbols: missing.map((entry) => entry.symbol),
    biggestMovers,
    flags,
  };
}

export function adaptThesisTracker(
  symbol: string,
  thesis: string,
  shareUrl: string | undefined,
  dimensions: DimensionScore[]
): ThesisTrackerResult {
  const relevant = selectRelevantDimensions(dimensions, thesis);
  const alignedDimensions = relevant
    ? relevant.aligned
    : [...dimensions].sort((a, b) => b.score - a.score || b.change - a.change).slice(0, 3);
  const contradictoryDimensions = relevant
    ? relevant.contradictory
    : [...dimensions].sort((a, b) => a.score - b.score || a.change - b.change).slice(0, 3);
  const verdict = inferVerdict(alignedDimensions, contradictoryDimensions);

  return {
    kind: "thesis-tracker",
    symbol,
    thesis,
    verdict,
    alignedDimensions,
    contradictoryDimensions,
    summary: buildThesisSummary(symbol, thesis, verdict, alignedDimensions, contradictoryDimensions),
    shareUrl,
  };
}
