import { adaptSearchResult, adaptStockAnalysis, adaptThesisTracker, adaptWatchlistReview, toDimensionScores } from "./adapters.js";
import type { BatchApiResult, HistoryApiResult, NewsApiResult, ScoreApiResult, SearchApiResult, ApiEnvelope } from "./raw-api-types.js";
import type { DimensionScore, StockAnalysisResult, StockSearchResult, ThesisTrackerResult, WatchlistReviewResult } from "./types.js";

type ApiClientOptions = {
  apiBaseUrl: string;
  apiKey: string;
};

function buildApiUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, normalizedBase);
}

function stripSignalFromScore(score: ScoreApiResult | (ScoreApiResult & { signal?: string })): ScoreApiResult {
  const { signal: _signal, ...rest } = score as ScoreApiResult & { signal?: string };
  return rest;
}

function stripSignalFromHistory(result: HistoryApiResult): HistoryApiResult {
  return {
    ...result,
    scores: result.scores.map((score) => stripSignalFromScore(score)),
  };
}

function stripSignalFromBatch(result: BatchApiResult): BatchApiResult {
  return {
    ...result,
    scores: result.scores.map((entry) => ("error" in entry ? entry : stripSignalFromScore(entry))),
  };
}

export class HaruspexApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async searchStocks(query: string): Promise<StockSearchResult> {
    const params = new URLSearchParams({ q: query, limit: "10" });
    const result = await this.fetchSearchStocks("/search?" + params.toString());
    return adaptSearchResult(query, result);
  }

  async analyzeStock(symbol: string, includeNews: boolean): Promise<StockAnalysisResult> {
    const normalized = symbol.trim().toUpperCase();
    const score = await this.fetchStockScore(normalized);
    const history = await this.fetchStockScoreHistory(normalized, 30);
    const shouldFetchNews = includeNews || Math.abs(score.change) >= 10;
    const news = shouldFetchNews ? await this.fetchStockNews(normalized, 5) : null;
    return adaptStockAnalysis(score, history, news);
  }

  async reviewWatchlist(symbols: string[]): Promise<WatchlistReviewResult> {
    const normalized = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)));
    const result = await this.fetchBatchScores(normalized);
    return adaptWatchlistReview(normalized, result);
  }

  async trackInvestmentThesis(symbol: string, thesis: string): Promise<ThesisTrackerResult> {
    const normalized = symbol.trim().toUpperCase();
    const score = await this.fetchStockScore(normalized);
    const dimensions = toDimensionScores(score.topicScores);
    return adaptThesisTracker(score.symbol, thesis, score.shareUrl || undefined, dimensions);
  }

  async fetchStockScore(symbol: string): Promise<ScoreApiResult> {
    return stripSignalFromScore(await this.request<ScoreApiResult & { signal?: string }>("/scores/" + encodeURIComponent(symbol)));
  }

  async fetchStockScoreHistory(symbol: string, limit = 30): Promise<HistoryApiResult> {
    return stripSignalFromHistory(await this.request<HistoryApiResult>("/scores/" + encodeURIComponent(symbol) + "/history?limit=" + limit));
  }

  async fetchBatchScores(symbols: string[]): Promise<BatchApiResult> {
    return stripSignalFromBatch(await this.request<BatchApiResult>("/scores/batch", {
      method: "POST",
      body: JSON.stringify({ symbols }),
    }));
  }

  async fetchSearchStocks(path: string): Promise<SearchApiResult> {
    return this.request<SearchApiResult>(path);
  }

  async fetchStockNews(symbol: string, limit = 5): Promise<NewsApiResult> {
    return this.request<NewsApiResult>("/stocks/" + encodeURIComponent(symbol) + "/news?limit=" + limit);
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(buildApiUrl(this.options.apiBaseUrl, path), {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.options.apiKey}`,
        ...(init?.headers || {}),
      },
    });

    const body = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok || body.status === "error" || !body.data) {
      throw new Error(body.error?.message || ("Haruspex API request failed: " + response.status + " " + response.statusText));
    }

    return body.data;
  }

  async fetchAllDimensions(symbol: string): Promise<DimensionScore[]> {
    const score = await this.fetchStockScore(symbol.trim().toUpperCase());
    return toDimensionScores(score.topicScores);
  }
}
