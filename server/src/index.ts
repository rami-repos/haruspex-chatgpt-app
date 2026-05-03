import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { HaruspexApiClient } from "./api-client.js";
import { loadConfig } from "./config.js";
import { registerHaruspexApp } from "./register-haruspex-app.js";

function createMcpServer() {
  const config = loadConfig();
  const server = new McpServer({
    name: config.appName,
    version: config.appVersion,
  });

  const apiClient = new HaruspexApiClient({
    apiBaseUrl: config.apiBaseUrl,
    apiKey: config.apiKey,
  });

  registerHaruspexApp(server, apiClient, {
    widgetDomain: config.widgetDomain,
  });

  return { server, config };
}

async function start() {
  const result = createMcpServer();
  const server = result.server;
  const config = result.config;

  const httpServer = createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400).end("Missing request URL");
      return;
    }

    const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));

    if (url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end([
        "Haruspex ChatGPT App MCP server",
        "MCP endpoint: " + config.mcpPath,
        "Use MCP Inspector or ChatGPT developer mode to connect.",
      ].join("\n"));
      return;
    }

    if (url.pathname !== config.mcpPath) {
      res.writeHead(404).end("Not found");
      return;
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    await server.connect(transport);
    await transport.handleRequest(req, res);
  });

  httpServer.listen(config.port, () => {
    console.log("Haruspex MCP server listening on http://localhost:" + config.port + config.mcpPath);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
