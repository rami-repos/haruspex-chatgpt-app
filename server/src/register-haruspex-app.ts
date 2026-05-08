import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HaruspexApiClient } from "./api-client.js";
import type { HaruspexToolResult } from "./types.js";

const RESOURCE_URI = "ui://widget/haruspex-dashboard-v1.html";
const DISCLAIMER_TEXT =
  "Haruspex scores are quantitative signals derived from public data and are provided for informational purposes only. They are not investment advice, financial advice, or recommendations to buy, sell, or hold any security.";

type RegisterHaruspexAppOptions = {
  widgetDomain: string;
};

function buildWidgetHtml() {
  const bundlePath = resolve(process.cwd(), "web/dist/component.js");
  let jsBundle = "";

  try {
    jsBundle = readFileSync(bundlePath, "utf8");
  } catch {
    jsBundle = [
      "const root = document.getElementById(\"root\");",
      "if (root) root.textContent = \"Build the widget bundle to render the Haruspex app UI.\";",
    ].join("\n");
  }

  return [
    "<div id=\"root\"></div>",
    "<script type=\"module\">",
    jsBundle,
    "</script>",
  ].join("\n");
}

function makeContentText(result: HaruspexToolResult) {
  switch (result.kind) {
    case "stock-analysis":
      return result.symbol + " score " + result.score + "/100 with " + result.outlook + " market conditions.";
    case "watchlist-review":
      return "Reviewed " + result.rows.length + " covered tickers from a watchlist of " + result.symbolsRequested.length + ".";
    case "thesis-tracker":
      return "Tracked the thesis for " + result.symbol + ": " + result.verdict + ".";
    case "stock-search":
      return "Found " + result.matches.length + " stock matches for \"" + result.query + "\".";
  }
}

export function registerHaruspexApp(server: McpServer, apiClient: HaruspexApiClient, options: RegisterHaruspexAppOptions) {
  registerAppResource(server, "haruspex-dashboard", RESOURCE_URI, {}, async () => ({
    contents: [
      {
        uri: RESOURCE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: buildWidgetHtml(),
        _meta: {
          ui: {
            prefersBorder: true,
            domain: options.widgetDomain,
            csp: {
              connectDomains: ["https://haruspex.guru", options.widgetDomain],
              resourceDomains: ["https://persistent.oaistatic.com"],
            },
          },
          "openai/widgetDescription": "Interactive Haruspex stock analysis dashboard for single-ticker, watchlist, thesis, and search results.",
        },
      },
    ],
  }));

  const withMeta = (result: HaruspexToolResult) => ({
    structuredContent: result,
    content: [{ type: "text" as const, text: makeContentText(result) }],
    _meta: { rawResult: result, disclaimer: DISCLAIMER_TEXT },
  });

  registerAppTool(server, "search_stocks", {
    title: "Search stocks",
    description: "Use this when the user gives a company name, an ambiguous ticker, or asks which listed symbol matches a company.",
    inputSchema: { query: z.string().min(1) },
    annotations: { readOnlyHint: true },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/toolInvocation/invoking": "Searching tickers...",
      "openai/toolInvocation/invoked": "Ticker matches ready.",
    },
  }, async ({ query }) => withMeta(await apiClient.searchStocks(query)));

  registerAppTool(server, "analyze_stock", {
    title: "Analyze a stock",
    description: "Use this when the user asks for analysis of a single stock ticker or company as an investment idea. Do not use for 3 or more tickers in one request.",
    inputSchema: { symbol: z.string().min(1), includeNews: z.boolean().optional() },
    annotations: { readOnlyHint: true },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/toolInvocation/invoking": "Analyzing stock...",
      "openai/toolInvocation/invoked": "Analysis ready.",
    },
  }, async ({ symbol, includeNews = false }) => withMeta(await apiClient.analyzeStock(symbol, includeNews)));

  registerAppTool(server, "review_watchlist", {
    title: "Review a watchlist",
    description: "Use this when the user wants a ranked review of 3 or more stock tickers, asks for a watchlist update, or wants a portfolio-style scan without trade advice.",
    inputSchema: { symbols: z.array(z.string().min(1)).min(3).max(10) },
    annotations: { readOnlyHint: true },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/toolInvocation/invoking": "Reviewing watchlist...",
      "openai/toolInvocation/invoked": "Watchlist review ready.",
    },
  }, async ({ symbols }) => withMeta(await apiClient.reviewWatchlist(symbols)));

  registerAppTool(server, "track_investment_thesis", {
    title: "Track an investment thesis",
    description: "Use this when the user states a thesis or rationale for owning a stock and wants to know whether the latest Haruspex dimensions still support it.",
    inputSchema: { symbol: z.string().min(1), thesis: z.string().min(10) },
    annotations: { readOnlyHint: true },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/toolInvocation/invoking": "Checking thesis...",
      "openai/toolInvocation/invoked": "Thesis check ready.",
    },
  }, async ({ symbol, thesis }) => withMeta(await apiClient.trackInvestmentThesis(symbol, thesis)));
}
