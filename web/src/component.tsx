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

type NewsItem = {
  headline?: string;
  source?: string;
  publishedAt?: string;
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

function formatChange(value: number | undefined) {
  if (typeof value !== "number") return "n/a";
  if (value > 0) return "+" + value;
  return String(value);
}

function scoreTone(score: number | undefined) {
  if (typeof score !== "number") return "#5f6b7a";
  if (score >= 75) return "#1f6b52";
  if (score >= 60) return "#6f5b19";
  return "#8b3d31";
}

function formatDate(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function shellStyle(): React.CSSProperties {
  return {
    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    color: "#1a2230",
    background:
      "radial-gradient(circle at top left, rgba(214, 225, 240, 0.92), rgba(244, 238, 229, 0.98) 46%, rgba(234, 240, 247, 0.96) 100%)",
    borderRadius: 24,
    padding: 20,
    border: "1px solid rgba(42, 59, 78, 0.08)",
    boxShadow: "0 16px 40px rgba(32, 45, 64, 0.12)",
  };
}

function sectionTitleStyle(): React.CSSProperties {
  return {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: "#6b7280",
    margin: "0 0 12px",
  };
}

function Card(props: { children: React.ReactNode; subtle?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 16,
        background: props.subtle ? "rgba(255,255,255,0.58)" : "rgba(255,255,255,0.78)",
        border: "1px solid rgba(42, 59, 78, 0.08)",
        boxShadow: props.subtle ? "none" : "0 10px 24px rgba(45, 58, 77, 0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      {props.children}
    </div>
  );
}

function Metric(props: { label: string; value: string; tone?: string }) {
  return (
    <Card subtle>
      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        {props.label}
      </div>
      <div style={{ fontSize: 31, lineHeight: 1, marginBottom: 6, color: props.tone || "#18212d" }}>{props.value}</div>
    </Card>
  );
}

function DimensionCards(props: { items: DimensionScore[]; empty: string }) {
  if (!props.items.length) {
    return <Card subtle><p style={{ margin: 0, color: "#6b7280" }}>{props.empty}</p></Card>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {props.items.map((item, index) => (
        <Card key={(item.key || item.label || "dimension") + index}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{String(item.label || item.key || "Dimension")}</div>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Change {formatChange(item.change)}
              </div>
            </div>
            <div style={{ fontSize: 28, color: scoreTone(item.score), whiteSpace: "nowrap" }}>
              {typeof item.score === "number" ? item.score + "/100" : "n/a"}
            </div>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.5, color: "#273244" }}>{String(item.summary || "")}</div>
        </Card>
      ))}
    </div>
  );
}

function BulletList(props: { items: React.ReactNode[]; empty?: string }) {
  if (!props.items.length) {
    return <Card subtle><p style={{ margin: 0, color: "#6b7280" }}>{props.empty || "None."}</p></Card>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.items.map((item, index) => (
        <Card key={index} subtle>
          <div style={{ fontSize: 15, lineHeight: 1.55 }}>{item}</div>
        </Card>
      ))}
    </div>
  );
}

function DataTable(props: { headers: string[]; rows: string[][] }) {
  return (
    <Card>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              {props.headers.map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    padding: "0 0 10px",
                    borderBottom: "1px solid rgba(42, 59, 78, 0.12)",
                    color: "#6b7280",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, rowIndex) => (
              <tr key={row.join("|") + rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding: "12px 0",
                      borderBottom: rowIndex === props.rows.length - 1 ? "none" : "1px solid rgba(42, 59, 78, 0.06)",
                      verticalAlign: "top",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}


function HaruspexIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="haruspexSphereGrad" cx="50%" cy="40%" r="50%" fx="50%" fy="40%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </radialGradient>
        <linearGradient id="haruspexWireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="#1a1a2e" />
      <g stroke="#8B5CF6" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4 L23 9 L16 13 L9 9 Z" />
        <line x1="16" y1="4" x2="16" y2="13" />
        <line x1="9" y1="9" x2="23" y2="9" />
      </g>
      <circle cx="16" cy="11" r="3.5" fill="url(#haruspexSphereGrad)" />
      <g stroke="url(#haruspexWireGrad)" strokeWidth="1.3" fill="none" strokeLinecap="round">
        <path d="M12 15 L9 22" />
        <circle cx="9" cy="23.5" r="1.8" fill="#8B5CF6" />
        <path d="M14 16 L13 24" />
        <circle cx="13" cy="25.5" r="1.8" fill="#8B5CF6" />
        <path d="M16 17 L16 25" />
        <circle cx="16" cy="27" r="2" fill="#A78BFA" />
        <path d="M18 16 L19 24" />
        <circle cx="19" cy="25.5" r="1.8" fill="#8B5CF6" />
        <path d="M20 15 L23 22" />
        <circle cx="23" cy="23.5" r="1.8" fill="#8B5CF6" />
      </g>
    </svg>
  );
}

function Header(props: { title: string; subtitle: string; badge?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.54)",
            border: "1px solid rgba(42, 59, 78, 0.08)",
            boxShadow: "0 8px 20px rgba(45, 58, 77, 0.08)",
          }}
        >
          <HaruspexIcon />
        </div>
        <div>
          <div style={{ fontSize: 34, lineHeight: 0.95, marginBottom: 8, letterSpacing: "-0.03em" }}>{props.title}</div>
          <div style={{ color: "#5d6775", fontSize: 16, lineHeight: 1.4 }}>{props.subtitle}</div>
        </div>
      </div>
      {props.badge ? (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(20, 31, 48, 0.88)",
            color: "#f4efe6",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}
        >
          {props.badge}
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const [result, setResult] = React.useState<ToolResultEnvelope | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let active = true;

    async function connect() {
      try {
        const createdApp = new McpApp({ name: "HaruspexWidget", version: "0.1.0" }, {});
        createdApp.ontoolresult = (params) => {
          if (active) setResult(params as ToolResultEnvelope);
        };
        await createdApp.connect(new PostMessageTransport(window.parent, window.parent));
        if (active) {
          setIsConnected(true);
          setError(null);
        }
      } catch (connectionError) {
        if (active) {
          setError(connectionError instanceof Error ? connectionError : new Error("Failed to connect widget"));
          setIsConnected(false);
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

  if (error) {
    return (
      <main style={shellStyle()}>
        <Header title="Haruspex" subtitle="Widget connection failed." badge="Connection error" />
        <Card><p style={{ margin: 0 }}>{error.message}</p></Card>
      </main>
    );
  }

  if (!isConnected || !payload?.kind) {
    return (
      <main style={shellStyle()}>
        <Header title="Haruspex" subtitle="Preparing the latest market view inside ChatGPT." badge="Loading" />
        <Card subtle><p style={{ margin: 0, color: "#5d6775" }}>Waiting for structured Haruspex analysis data.</p></Card>
      </main>
    );
  }

  return (
    <main style={shellStyle()}>
      {payload.kind === "stock-analysis" && (
        <>
          <Header
            title={String(payload.symbol || "Haruspex")}
            subtitle="A high-signal snapshot of score, positioning, trajectory, and current news context."
            badge={String(payload.signal || "analysis")}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 20 }}>
            <Metric label="Score" value={String(payload.score) + "/100"} tone={scoreTone(payload.score as number)} />
            <Metric label="Signal" value={String(payload.signal)} />
            <Metric label="Outlook" value={String(payload.outlook)} />
            <Metric label="Change" value={formatChange(payload.change as number)} />
          </div>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Strongest positives</h2>
            <DimensionCards items={asArray<DimensionScore>(payload.positives)} empty="No positive dimensions surfaced." />
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Watch dimensions</h2>
            <DimensionCards items={asArray<DimensionScore>(payload.watch)} empty="No major watch dimensions right now." />
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Trajectory</h2>
            <Card>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>{String(payload.trajectorySummary || "")}</p>
            </Card>
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>News context</h2>
            <BulletList
              items={asArray<NewsItem>(payload.news).map((item) => (
                <>
                  <strong>{String(item.headline || "")}</strong>
                  <div style={{ marginTop: 6, color: "#5d6775", fontSize: 13 }}>
                    {String(item.source || "")} {item.publishedAt ? "• " + formatDate(item.publishedAt) : ""}
                  </div>
                </>
              ))}
              empty="No news context fetched for this run."
            />
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Verify</h2>
            <Card subtle>
              <a href={String(payload.shareUrl || "#")} style={{ color: "#1d4d8f", textDecoration: "none", wordBreak: "break-all", fontSize: 15 }}>
                {String(payload.shareUrl || "")}
              </a>
            </Card>
          </section>
        </>
      )}

      {payload.kind === "watchlist-review" && (
        <>
          <Header
            title="Watchlist"
            subtitle="A ranked review of relative strength, trend, and emerging pressure points across the requested names."
            badge={String(asArray<WatchlistRow>(payload.rows).length) + " covered"}
          />

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Ranked results</h2>
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
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Biggest movers</h2>
            <BulletList
              items={asArray<Mover>(payload.biggestMovers).map((item) => (
                <>
                  <strong>{String(item.symbol || "")}</strong>
                  <div style={{ marginTop: 6, color: "#5d6775" }}>{String(item.summary || "")}</div>
                </>
              ))}
              empty="No movers surfaced."
            />
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Watch closely</h2>
            <BulletList
              items={asArray<WatchFlag>(payload.flags).map((item) => (
                <>
                  <strong>{String(item.symbol || "")}</strong>
                  <div style={{ marginTop: 6, color: "#5d6775" }}>
                    {String(item.dimension || "")} at {typeof item.score === "number" ? item.score + "/100" : "n/a"} ({formatChange(item.change)})
                  </div>
                </>
              ))}
              empty="No acute flags surfaced."
            />
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Coverage gaps</h2>
            <BulletList items={asArray<string>(payload.missingSymbols).map((item) => <>{item}</>)} empty="No coverage gaps in this request." />
          </section>
        </>
      )}

      {payload.kind === "thesis-tracker" && (
        <>
          <Header
            title={String(payload.symbol || "Thesis")}
            subtitle={String(payload.summary || "Latest Haruspex evidence against the current investment case.")}
            badge={String(payload.verdict || "review")}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
            <Metric label="Ticker" value={String(payload.symbol || "")} />
            <Metric label="Verdict" value={String(payload.verdict || "")} />
          </div>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Supporting dimensions</h2>
            <DimensionCards items={asArray<DimensionScore>(payload.alignedDimensions)} empty="No supporting dimensions identified." />
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Contradicting dimensions</h2>
            <DimensionCards items={asArray<DimensionScore>(payload.contradictoryDimensions)} empty="No contradicting dimensions identified." />
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Verify</h2>
            <Card subtle>
              <a href={String(payload.shareUrl || "#")} style={{ color: "#1d4d8f", textDecoration: "none", wordBreak: "break-all", fontSize: 15 }}>
                {String(payload.shareUrl || "")}
              </a>
            </Card>
          </section>
        </>
      )}

      {payload.kind === "stock-search" && (
        <>
          <Header
            title="Ticker search"
            subtitle={"Matching listed names for “" + String(payload.query || "") + "”."}
            badge={String(asArray<Record<string, unknown>>(payload.matches).length) + " matches"}
          />

          <section style={{ marginBottom: 18 }}>
            <h2 style={sectionTitleStyle()}>Results</h2>
            <DataTable
              headers={["Ticker", "Company", "Exchange"]}
              rows={asArray<Record<string, unknown>>(payload.matches).map((item) => [
                String(item.symbol || ""),
                String(item.name || ""),
                String(item.exchange || ""),
              ])}
            />
          </section>
        </>
      )}

      {disclaimer ? <p style={{ color: "#697384", fontSize: 12, margin: "10px 2px 0" }}>{disclaimer}</p> : null}
    </main>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
