# Haruspex ChatGPT App

ChatGPT App and MCP server for Haruspex stock analysis workflows.

This repo is the OpenAI-side companion to your Claude skills project. It keeps the same product capabilities, but expresses them in the shape ChatGPT Apps expects:

- MCP tools with strong metadata
- concise `structuredContent` for the model
- richer `_meta` for the widget
- a reusable embedded UI resource

## Tool map

| Claude workflow | ChatGPT App tool |
|---|---|
| single ticker analysis | `analyze_stock` |
| watchlist review | `review_watchlist` |
| thesis tracking | `track_investment_thesis` |
| ticker disambiguation | `search_stocks` |

## Project layout

```text
.
├─ package.json
├─ tsconfig.json
├─ server/
│  └─ src/
│     ├─ api-client.ts
│     ├─ config.ts
│     ├─ index.ts
│     ├─ register-haruspex-app.ts
│     └─ types.ts
└─ web/
   └─ src/
      └─ component.tsx
```

## Environment

Required:

- `HARUSPEX_API_KEY`

Optional:

- `HARUSPEX_API_BASE_URL`
  Default: `https://haruspex.guru/api/v1`
- `PORT`
  Default: `8787`
- `MCP_PATH`
  Default: `/mcp`
- `HARUSPEX_WIDGET_DOMAIN`
  Default: `https://chatgpt.haruspex.guru`
- `HARUSPEX_APP_NAME`
  Default: `haruspex-chatgpt-app`
- `HARUSPEX_APP_VERSION`
  Default: `0.1.0`

## Local development

1. Install dependencies:

```bash
npm install
```

2. Export your API key:

```bash
export HARUSPEX_API_KEY=your_real_key_here
```

3. Start the local MCP server:

```bash
npm run dev
```

4. Build production assets:

```bash
npm run build
```

5. Run the built server:

```bash
npm start
```

The MCP endpoint will be available at `http://localhost:8787/mcp`.

## Testing

The official Apps SDK quickstart recommends testing locally with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest --server-url http://localhost:8787/mcp --transport http
```

Then connect the same endpoint in ChatGPT developer mode and run through your golden prompts.

## Remaining product work

- Replace placeholder endpoint paths in `server/src/api-client.ts` with your real Haruspex API routes.
- Decide whether thesis tracking stays as a dedicated backend endpoint or is synthesized inside this app server.
- Expand the widget into a fuller stock dashboard once the live payload shapes are locked.

## Smoke test

After exporting your API key, run:

```bash
npm run build
npm run smoke:test:built
```

Optional overrides:

- `HARUSPEX_SMOKE_SYMBOL`
- `HARUSPEX_SMOKE_WATCHLIST`
- `HARUSPEX_SMOKE_QUERY`
- `HARUSPEX_SMOKE_THESIS`
