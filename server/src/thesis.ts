import type { DimensionScore } from "./types.js";

type ThesisKeywordGroup = {
  keys: string[];
  keywords: string[];
};

const THESIS_KEYWORD_GROUPS: ThesisKeywordGroup[] = [
  {
    keys: ["ai-exposure", "competitors", "fundamentals"],
    keywords: ["ai", "artificial intelligence", "gpu", "chips", "data center", "datacenter", "inference", "training", "semiconductor"],
  },
  {
    keys: ["earnings", "fundamentals"],
    keywords: ["earnings", "revenue", "margin", "profit", "cash flow", "free cash flow", "guidance", "valuation", "balance sheet", "fundamental", "fundamentals"],
  },
  {
    keys: ["competitors"],
    keywords: ["competition", "competitive", "market share", "moat", "pricing power", "leader", "dominance"],
  },
  {
    keys: ["regulatory", "geopolitical"],
    keywords: ["regulation", "regulatory", "antitrust", "ban", "export restriction", "export restrictions", "policy", "government", "compliance"],
  },
  {
    keys: ["supplychain", "geopolitical"],
    keywords: ["supply chain", "supplier", "manufacturing", "inventory", "logistics", "taiwan", "china", "export control", "tariff"],
  },
  {
    keys: ["sentiment", "shortinterest", "microstructure"],
    keywords: ["sentiment", "momentum", "crowded", "squeeze", "short interest", "positioning", "flow", "trading"],
  },
  {
    keys: ["macro", "climate", "esg"],
    keywords: ["rates", "inflation", "macro", "economy", "oil", "commodity", "energy", "climate", "esg"],
  },
  {
    keys: ["patents", "jobs", "insider"],
    keywords: ["hiring", "jobs", "headcount", "innovation", "patent", "insider", "management", "executive"],
  },
];

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreDimensionRelevance(dimension: DimensionScore, thesis: string) {
  const normalizedThesis = normalizeText(thesis);
  const normalizedKey = normalizeText(dimension.key);
  const normalizedLabel = normalizeText(dimension.label);
  let score = 0;

  if (normalizedThesis.includes(normalizedKey)) score += 4;
  if (normalizedThesis.includes(normalizedLabel)) score += 4;

  for (const group of THESIS_KEYWORD_GROUPS) {
    const matchesDimension = group.keys.some(
      (key) => normalizedKey.includes(key) || normalizedLabel.includes(key.replace(/-/g, " "))
    );
    if (!matchesDimension) continue;
    for (const keyword of group.keywords) {
      if (normalizedThesis.includes(normalizeText(keyword))) score += 2;
    }
  }

  return score;
}

export function selectRelevantDimensions(dimensions: DimensionScore[], thesis: string) {
  const scored = dimensions
    .map((dimension) => ({ dimension, relevance: scoreDimensionRelevance(dimension, thesis) }))
    .filter((entry) => entry.relevance > 0);

  if (!scored.length) return null;

  const aligned = [...scored]
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        b.dimension.score - a.dimension.score ||
        b.dimension.change - a.dimension.change
    )
    .map((entry) => entry.dimension)
    .slice(0, 3);

  const alignedKeys = new Set(aligned.map((dimension) => dimension.key));

  let contradictory = scored
    .filter((entry) => !alignedKeys.has(entry.dimension.key))
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        a.dimension.score - b.dimension.score ||
        a.dimension.change - b.dimension.change
    )
    .map((entry) => entry.dimension)
    .slice(0, 3);

  if (!contradictory.length) {
    contradictory = dimensions
      .filter((dimension) => !alignedKeys.has(dimension.key))
      .sort((a, b) => a.score - b.score || a.change - b.change)
      .slice(0, 3);
  }

  return { aligned, contradictory };
}

export function inferVerdict(aligned: DimensionScore[], contradictory: DimensionScore[]) {
  const positive = aligned.reduce((sum, item) => sum + item.score, 0) / Math.max(aligned.length, 1);
  const negative = contradictory.reduce((sum, item) => sum + item.score, 0) / Math.max(contradictory.length, 1);
  const delta = positive - negative;
  if (delta >= 20) return "supported";
  if (delta <= 5) return "at risk";
  return "mixed";
}

export function buildThesisSummary(
  symbol: string,
  thesis: string,
  verdict: string,
  aligned: DimensionScore[],
  contradictory: DimensionScore[]
) {
  const topAligned = aligned.slice(0, 2).map((item) => item.label).join(", ") || "no clear strengths";
  const topRisk = contradictory.slice(0, 2).map((item) => item.label).join(", ") || "no clear risks";
  const verdictPhrase = verdict === "supported"
    ? "still looks supported by the latest Haruspex evidence"
    : verdict === "at risk"
      ? "looks less supported by the latest Haruspex evidence"
      : "looks mixed based on the latest Haruspex evidence";
  return "For " + symbol + ", the stated thesis (" + thesis + ") " + verdictPhrase + ". The most relevant supporting dimensions are " + topAligned + ", while the most relevant tensions come from " + topRisk + ".";
}
