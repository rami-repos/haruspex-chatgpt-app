const DEFAULT_API_BASE_URL = "https://haruspex.guru/api/v1";
const DEFAULT_PORT = 8787;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_MCP_PATH = "/mcp";

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig() {
  return {
    appName: process.env.HARUSPEX_APP_NAME?.trim() || "haruspex-chatgpt-app",
    appVersion: process.env.HARUSPEX_APP_VERSION?.trim() || "0.1.0",
    apiBaseUrl: process.env.HARUSPEX_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
    apiKey: readRequiredEnv("HARUSPEX_API_KEY"),
    port: Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10),
    host: process.env.HOST?.trim() || DEFAULT_HOST,
    mcpPath: process.env.MCP_PATH?.trim() || DEFAULT_MCP_PATH,
    widgetDomain: process.env.HARUSPEX_WIDGET_DOMAIN?.trim() || "https://chatgpt.haruspex.guru",
  };
}
