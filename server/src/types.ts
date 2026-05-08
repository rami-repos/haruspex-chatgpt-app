export type DimensionScore = {
  key: string;
  label: string;
  score: number;
  change: number;
  summary: string;
};

export type StockAnalysisResult = {
  kind: "stock-analysis";
  symbol: string;
  companyName?: string;
  score: number;
  change: number;
  outlook: string;
  shareUrl: string;
  positives: DimensionScore[];
  watch: DimensionScore[];
  trajectorySummary: string;
  news?: Array<{
    headline: string;
    source: string;
    publishedAt: string;
    url?: string;
  }>;
};

export type WatchlistRow = {
  symbol: string;
  score: number;
  change: number;
  outlook: string;
  shareUrl: string;
  topDriver?: string;
};

export type WatchlistReviewResult = {
  kind: "watchlist-review";
  symbolsRequested: string[];
  rows: WatchlistRow[];
  missingSymbols: string[];
  biggestMovers: Array<{
    symbol: string;
    change: number;
    summary: string;
  }>;
  flags: Array<{
    symbol: string;
    dimension: string;
    score: number;
    change: number;
    summary: string;
  }>;
};

export type ThesisTrackerResult = {
  kind: "thesis-tracker";
  symbol: string;
  thesis: string;
  verdict: string;
  alignedDimensions: DimensionScore[];
  contradictoryDimensions: DimensionScore[];
  summary: string;
  shareUrl?: string;
};

export type StockSearchMatch = {
  symbol: string;
  name: string;
  exchange?: string;
};

export type StockSearchResult = {
  kind: "stock-search";
  query: string;
  matches: StockSearchMatch[];
};

export type HaruspexToolResult =
  | StockAnalysisResult
  | WatchlistReviewResult
  | ThesisTrackerResult
  | StockSearchResult;
