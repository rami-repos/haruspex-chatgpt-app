import React from "react";
import { createRoot } from "react-dom/client";
import { App as McpApp, PostMessageTransport } from "@modelcontextprotocol/ext-apps";

type DimensionScore = {
  key?: string;
  label?: string;
  score?: number;
  change?: number;
  summary?: string;
};

type WatchlistRow = {
  symbol?: string;
  score?: number;
  change?: number;
  outlook?: string;
  signal?: string;
  shareUrl?: string;
  topDriver?: string;
};

type WatchFlag = {
  symbol?: string;
  dimension?: string;
  score?: number;
  change?: number;
  summary?: string;
};

type Mover = {
  symbol?: string;
  change?: number;
  summary?: string;
};

type ToolPayload = {
  kind?: string;
  [key: string]: unknown;
};

type ToolResultEnvelope = {
  structuredContent?: ToolPayload;
  _meta?: Record<string, unknown>;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 16, margin: "0 0 10px", letterSpacing: "0.01em" }}>{props.title}</h2>
      {props.children}
    </section>
  );
}

function Card(props: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid rgba(29,29,27,0.08)",
        borderRadius: 16,
        padding: 12,
        background: "rgba(255,255,255,0.72)",
      }}
    >
      {props.children}
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <Card>
      <div style={{ fontSize: 12, color: "#6a6760", marginBottom: 4 }}>{props.label}</div>
      <div style={{ fontSize: 18 }}>{props.value}</div>
    </Card>
  );
}

function formatChange(value: number | undefined) {
  if (typeof value !== "number") return "n/a";
  if (value > 0) return "+" + value;
  return String(value);
}

function BulletList(props: { items: string[]; empty?: string }) {
  if (!props.items.length) {
    return <p style={{ margin: 0, color: "#6a6760" }}>{props.empty || "None."}</p>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {props.items.map((item) => (
        <li key={item} style={{ marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

function DimensionCards(props: { items: DimensionScore[]; empty: string }) {
  if (!props.items.length) {
    return <p style={{ margin: 0, color: "#6a6760" }}>{props.empty}</p>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.items.map((item, index) => (
        <Card key={(item.key || item.label || "dimension") + index}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
            <strong>{String(item.label || item.key || "Dimension")}</strong>
            <span>{typeof item.score === "number" ? item.score + "/100" : "n/a"}</span>
          </div>
          <div style={{ color: "#6a6760", fontSize: 13, marginBottom: 4 }}>Change {formatChange(item.change)}</div>
          <div style={{ fontSize: 14 }}>{String(item.summary || "")}</div>
        </Card>
      ))}
    </div>
  );
}

function DataTable(props: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {props.headers.map((header) => (
              <th key={header} style={{ textAlign: "left", padding: "0 0 8px", borderBottom: "1px solid rgba(29,29,27,0.12)" }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, rowIndex) => (
            <tr key={row.join("|") + rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ padding: "10px 0", borderBottom: "1px solid rgba(29,29,27,0.06)", verticalAlign: "top" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [result, setResult] = React.useState<ToolResultEnvelope | null>(null);
  const [app, setApp] = React.useState<McpApp | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let active = true;

    async function connect() {
      try {
        const createdApp = new McpApp({ name: "HaruspexWidget", version: "0.1.0" }, {});
        createdApp.ontoolresult = (params) => {
          if (active) {
            setResult(params as ToolResultEnvelope);
          }
        };
        await createdApp.connect(new PostMessageTransport(window.parent, window.parent));
        if (active) {
          setApp(createdApp);
          setIsConnected(true);
          setError(null);
        }
      } catch (connectionError) {
        if (active) {
          setError(connectionError instanceof Error ? connectionError : new Error("Failed to connect widget"));
          setIsConnected(false);
          setApp(null);
        }
      }
    }

    void connect();
    return () => {
      active = false;
    };
  }, []);

  const payload = result?.structuredContent;
  const disclaimer = String(result?._meta?.disclaimer || "");

  const mainStyle: React.CSSProperties = {
    fontFamily: "Georgia, serif",
    padding: 16,
    color: "#1d1d1b",
    background: "radial-gradient(circle at top, rgba(219,231,245,0.9), rgba(247,243,236,1) 55%)",
    minHeight: "100vh",
  };

  if (error) {
    return (
      <main style={mainStyle}>
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Haruspex</h1>
        <p style={{ marginBottom: 0 }}>Widget connection failed: {error.message}</p>
      </main>
    );
  }

  if (!isConnected || !payload?.kind) {
    return (
      <main style={mainStyle}>
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Haruspex</h1>
        <p style={{ marginBottom: 0 }}>Waiting for Haruspex analysis data from ChatGPT.</p>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <h1 style={{ fontSize: 22, marginTop: 0 }}>Haruspex</h1>
      <p style={{ color: "#5b5a57", marginTop: -4 }}>Structured market analysis rendered inside ChatGPT.</p>

      {payload.kind === "stock-analysis" && (
        <>
          <Section title={String(payload.symbol) + " overview"}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              <Metric label="Score" value={String(payload.score) + "/100"} />
              <Metric label="Signal" value={String(payload.signal)} />
              <Metric label="Outlook" value={String(payload.outlook)} />
              <Metric label="Change" value={formatChange(payload.change as number)} />
            </div>
          </Section>

          <Section title="Strongest positives">
            <DimensionCards items={asArray<DimensionScore>(payload.positives)} empty="No positive dimensions surfaced." />
          </Section>

          <Section title="Watch dimensions">
            <DimensionCards items={asArray<DimensionScore>(payload.watch)} empty="No major watch dimensions right now." />
          </Section>

          <Section title="Trajectory">
            <Card><p style={{ margin: 0 }}>{String(payload.trajectorySummary || "")}</p></Card>
          </Section>

          <Section title="News context">
            <BulletList
              items={asArray<Record<string, unknown>>(payload.news).map((item) => String(item.headline || "") + " — " + String(item.source || "") + " (" + String(item.publishedAt || "") + ")")}
              empty="No news context fetched for this run."
            />
          </Section>

          <Section title="Verify">
            <Card><p style={{ margin: 0, wordBreak: "break-all" }}>{String(payload.shareUrl || "")}</p></Card>
          </Section>
        </>
      )}

      {payload.kind === "watchlist-review" && (
        <>
          <Section title="Watchlist review">
            <Card>
              <p style={{ margin: 0 }}>
                Reviewed {asArray<WatchlistRow>(payload.rows).length} covered tickers from a requested list of {asArray<string>(payload.symbolsRequested).length}.
              </p>
            </Card>
          </Section>

          <Section title="Ranked results">
            <DataTable
              headers={["Ticker", "Score", "Change", "Signal", "Top driver"]}
              rows={asArray<WatchlistRow>(payload.rows).map((row) => [
                String(row.symbol || ""),
                typeof row.score === "number" ? row.score + "/100" : "n/a",
                formatChange(row.change),
                String(row.signal || ""),
                String(row.topDriver || ""),
              ])}
            />
          </Section>

          <Section title="Biggest movers">
            <BulletList
              items={asArray<Mover>(payload.biggestMovers).map((item) => String(item.symbol || "") + " — " + String(item.summary || ""))}
              empty="No movers surfaced."
            />
          </Section>

          <Section title="Watch closely">
            <BulletList
              items={asArray<WatchFlag>(payload.flags).map((item) => String(item.symbol || "") + ": " + String(item.dimension || "") + " at " + (typeof item.score === "number" ? item.score + "/100" : "n/a") + " (" + formatChange(item.change) + ")")}
              empty="No acute flags surfaced."
            />
          </Section>

          <Section title="Coverage gaps">
            <BulletList items={asArray<string>(payload.missingSymbols)} empty="No coverage gaps in this request." />
          </Section>
        </>
      )}

      {payload.kind === "thesis-tracker" && (
        <>
          <Section title="Thesis check">
            <Card><p style={{ margin: 0 }}>{String(payload.summary || "")}</p></Card>
          </Section>

          <Section title="Verdict">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <Metric label="Ticker" value={String(payload.symbol || "")} />
              <Metric label="Verdict" value={String(payload.verdict || "")} />
            </div>
          </Section>

          <Section title="Supporting dimensions">
            <DimensionCards items={asArray<DimensionScore>(payload.alignedDimensions)} empty="No supporting dimensions identified." />
          </Section>

          <Section title="Contradicting dimensions">
            <DimensionCards items={asArray<DimensionScore>(payload.contradictoryDimensions)} empty="No contradicting dimensions identified." />
          </Section>

          <Section title="Verify">
            <Card><p style={{ margin: 0, wordBreak: "break-all" }}>{String(payload.shareUrl || "")}</p></Card>
          </Section>
        </>
      )}

      {payload.kind === "stock-search" && (
        <>
          <Section title="Ticker matches">
            <Card><p style={{ margin: 0 }}>Found {asArray<Record<string, unknown>>(payload.matches).length} matches for {String(payload.query || "")}.</p></Card>
          </Section>
          <Section title="Results">
            <DataTable
              headers={["Ticker", "Company", "Exchange"]}
              rows={asArray<Record<string, unknown>>(payload.matches).map((item) => [
                String(item.symbol || ""),
                String(item.name || ""),
                String(item.exchange || ""),
              ])}
            />
          </Section>
        </>
      )}

      {disclaimer ? <p style={{ color: "#6a6760", fontSize: 12, marginBottom: 0 }}>{disclaimer}</p> : null}
    </main>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
