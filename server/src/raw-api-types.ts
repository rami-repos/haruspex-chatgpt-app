export type ApiEnvelope<T> = {
  status: string;
  data?: T;
  error?: {
    message?: string;
  };
};

export type ScoreApiResult = {
  symbol: string;
  score: number;
  previousScore: number | null;
  change: number;
  outlook: string;
  signal: string;
  shareUrl: string | null;
  date: string;
  topicScores: Record<string, { name: string; score: number; change: number }>;
  companyName?: string;
};

export type HistoryApiResult = {
  symbol: string;
  from: string;
  to: string;
  count: number;
  scores: ScoreApiResult[];
};

export type BatchApiResult = {
  count: number;
  scores: Array<ScoreApiResult | { symbol: string; error: string }>;
};

export type SearchApiResult = {
  results: Array<{ symbol: string; name: string; exchange: string | null; type: string }>;
};

export type NewsApiResult = {
  symbol: string;
  articles: Array<{
    title: string;
    url: string;
    publishedAt: string;
    source: string;
  }>;
};
