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

const COLORS = {
  bg: "#07111f",
  bg2: "#0d1830",
  panel: "rgba(10, 20, 40, 0.86)",
  panelSoft: "rgba(19, 32, 58, 0.82)",
  border: "rgba(139, 163, 255, 0.14)",
  text: "#eef4ff",
  muted: "#94a3c4",
  muted2: "#6e7f9f",
  cyan: "#59f3cf",
  cyanSoft: "#1fd7a7",
  purple: "#8a7dff",
  blue: "#57a8ff",
  amber: "#f5bf63",
  red: "#ff6d6d",
};


const INFO_LINE = "For informational purposes only, not financial advice.";

function InfoFootnote() {
  return <div style={{ fontSize: 11, color: COLORS.muted2, marginTop: 10 }}>{INFO_LINE}</div>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatChange(value: number | undefined) {
  if (typeof value !== "number") return "";
  if (value > 0) return "+" + value;
  if (value < 0) return String(value);
  return "";
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

function displayLabel(input: string | undefined) {
  if (!input) return "Unknown";
  return input.replaceAll("-", " ");
}

function titleCase(input: string | undefined) {
  return displayLabel(input)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function scoreColor(score: number | undefined) {
  if (typeof score !== "number") return COLORS.muted;
  if (score >= 60) return COLORS.cyan;
  if (score >= 40) return COLORS.blue;
  return COLORS.red;
}

function signalTone(signal: string | undefined) {
  const normalized = (signal || "").toLowerCase();
  if (normalized.includes("buy")) return { bg: "rgba(24, 118, 91, 0.26)", border: "rgba(62, 236, 180, 0.34)", text: COLORS.cyan };
  if (normalized.includes("hold")) return { bg: "rgba(133, 102, 31, 0.24)", border: "rgba(245, 191, 99, 0.24)", text: COLORS.amber };
  if (normalized.includes("reduce")) return { bg: "rgba(151, 92, 24, 0.24)", border: "rgba(255, 163, 72, 0.28)", text: "#ffb866" };
  return { bg: "rgba(122, 37, 48, 0.28)", border: "rgba(255, 109, 109, 0.25)", text: COLORS.red };
}

function shellStyle(): React.CSSProperties {
  return {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: COLORS.text,
    background: [
      "radial-gradient(circle at 18% 14%, rgba(60, 219, 175, 0.18), transparent 24%)",
      "radial-gradient(circle at 86% 70%, rgba(122, 95, 255, 0.16), transparent 26%)",
      "linear-gradient(135deg, #091222 0%, #0c1730 42%, #09111f 100%)",
    ].join(", "),
    borderRadius: 26,
    padding: 18,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 18px 60px rgba(0, 0, 0, 0.34)",
    overflow: "hidden",
  };
}

function panelStyle(subtle = false): React.CSSProperties {
  return {
    background: subtle ? COLORS.panelSoft : COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    padding: 16,
    boxShadow: subtle ? "none" : "0 18px 40px rgba(0, 0, 0, 0.18)",
    backdropFilter: "blur(16px)",
  };
}

function eyebrowStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: COLORS.muted2,
    margin: 0,
  };
}

function sectionTitleStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: COLORS.muted2,
    margin: "0 0 12px",
  };
}

function HaruspexIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
      <circle cx="16" cy="16" r="15" fill="#0c1525" />
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

function Header(props: { title: string; subtitle: string; badge?: string; badgeTone?: { bg: string; border: string; text: string } }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}` }}>
          <HaruspexIcon />
        </div>
        <div>
          <div style={{ fontSize: 28, letterSpacing: "-0.03em", fontWeight: 700, marginBottom: 4 }}>{props.title}</div>
          <div style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.45, maxWidth: 540 }}>{props.subtitle}</div>
        </div>
      </div>
      {props.badge ? (
        <div style={{
          padding: "8px 12px",
          borderRadius: 999,
          background: props.badgeTone?.bg || "rgba(255,255,255,0.04)",
          border: `1px solid ${props.badgeTone?.border || COLORS.border}`,
          color: props.badgeTone?.text || COLORS.cyan,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          whiteSpace: "nowrap"
        }}>
          {props.badge}
        </div>
      ) : null}
    </div>
  );
}

function Gauge(props: { score: number; outlook: string; change?: number; compact?: boolean }) {
  const score = clamp(props.score, 0, 100);
  const degrees = 360 * (score / 100);
  const ringColor = scoreColor(score);
  return (
    <div style={{ ...panelStyle(), minHeight: props.compact ? 0 : 280, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 40% 35%, rgba(89,243,207,0.18), transparent 30%)" }} />
      <p style={eyebrowStyle()}>Market conditions</p>
      <div style={{ display: "grid", placeItems: "center", marginTop: 10 }}>
        <div
          style={{
            width: props.compact ? 170 : 220,
            height: props.compact ? 170 : 220,
            borderRadius: "50%",
            background: `conic-gradient(${ringColor} ${degrees}deg, rgba(255,255,255,0.08) ${degrees}deg 360deg)`,
            padding: 16,
            boxShadow: `0 0 50px ${ringColor}33`,
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "radial-gradient(circle at top, rgba(8,18,33,0.96), rgba(6,13,24,0.98))", border: `1px solid ${COLORS.border}`, display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: props.compact ? 42 : 54, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: props.compact ? 18 : 24, color: COLORS.muted, marginBottom: 14 }}>/100</div>
              <div style={{ display: "inline-flex", padding: "8px 14px", borderRadius: 999, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.04)", color: ringColor, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {props.outlook}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: props.compact ? "1fr 1fr" : "1fr 1fr", gap: 12, marginTop: 14, color: COLORS.muted, fontSize: 13 }}>
        <span>Composite score strength</span>
        <span>{formatChange(props.change) ? `Momentum ${formatChange(props.change)}` : "Momentum stable"}</span>
      </div>
      <InfoFootnote />
    </div>
  );
}

function DecisionCard(props: { signal: string; summary: string }) {
  const tone = signalTone(props.signal);
  return (
    <div style={{ ...panelStyle(true), minHeight: 170 }}>
      <p style={eyebrowStyle()}>Decision</p>
      <div style={{ display: "inline-flex", marginTop: 12, marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.text, fontSize: 24, lineHeight: 1, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {props.signal}
      </div>
      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: COLORS.text }}>{props.summary}</p>
      <InfoFootnote />
    </div>
  );
}

function StatChip(props: { title: string; value: string; note: string; tone?: string }) {
  return (
    <div style={{ ...panelStyle(true), padding: 14, minHeight: 136, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 11, color: COLORS.muted2, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>{props.title}</div>
      <div style={{ fontSize: 16, lineHeight: 1.2, fontWeight: 500, color: props.tone || COLORS.text, marginBottom: 10, maxWidth: "10ch", minHeight: 40 }}>
        {props.value}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.45, color: COLORS.muted, marginTop: "auto" }}>{props.note}</div>
      <InfoFootnote />
    </div>
  );
}

function FactorRow(props: { item: DimensionScore; tone?: string }) {
  return (
    <div style={{ ...panelStyle(true), padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: 17, fontWeight: 600 }}>{titleCase(props.item.label || props.item.key)}</div>
        <div style={{ fontSize: 19, color: props.tone || scoreColor(props.item.score) }}>
          {typeof props.item.score === "number" ? props.item.score + "/100" : "n/a"}
        </div>
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Change {formatChange(props.item.change)}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: COLORS.muted }}>{String(props.item.summary || "")}</div>
      <InfoFootnote />
    </div>
  );
}

function MatrixTable(props: { rows: string[][]; headers: string[] }) {
  return (
    <div style={panelStyle()}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {props.headers.map((header) => (
                <th key={header} style={{ textAlign: "left", paddingBottom: 12, fontSize: 11, color: COLORS.muted2, textTransform: "uppercase", letterSpacing: "0.14em", borderBottom: `1px solid ${COLORS.border}` }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, rowIndex) => (
              <tr key={row.join("|") + rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: "14px 0", borderBottom: rowIndex === props.rows.length - 1 ? "none" : `1px solid ${COLORS.border}`, color: cellIndex === 0 ? COLORS.text : COLORS.muted, fontSize: 14 }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InfoFootnote />
    </div>
  );
}


function useViewportWidth() {
  const [width, setWidth] = React.useState(() => (typeof window === "undefined" ? 1024 : window.innerWidth));

  React.useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
}

function App() {
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 700;
  const [result, setResult] = React.useState<ToolResultEnvelope | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let active = true;
    async function connect() {
      try {
        const createdApp = new McpApp({ name: "HaruspexWidget", version: "0.1.1" }, {});
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
        <Header title="Haruspex" subtitle="Widget connection failed." badge="Error" />
        <div style={panelStyle()}>{error.message}</div>
      </main>
    );
  }

  if (!isConnected || !payload?.kind) {
    return (
      <main style={shellStyle()}>
        <Header title="Haruspex" subtitle="Preparing the latest market view inside ChatGPT." badge="Loading" />
        <div style={panelStyle()}>Waiting for structured Haruspex analysis data.</div>
      </main>
    );
  }

  if (payload.kind === "stock-analysis") {
    const positives = asArray<DimensionScore>(payload.positives);
    const watch = asArray<DimensionScore>(payload.watch);
    const score = typeof payload.score === "number" ? payload.score : 0;
    const strongest = positives[0];
    const keyRisk = watch[0];
    const rawDecisionSummary = String(payload.trajectorySummary || "Current directional pressure is mixed.");
    const decisionSummary = rawDecisionSummary === "No recent score history is available yet."
      ? "This is a fresh Haruspex snapshot with limited recent trend history, so the score is current but short-term momentum context is still building."
      : rawDecisionSummary;
    const signalStyle = signalTone(String(payload.signal || "hold"));

    return (
      <main style={shellStyle()}>
        <Header
          title={String(payload.symbol || "Haruspex")}
          subtitle={String(payload.companyName || "Latest Haruspex decision layer for the current market setup.")}
          badge={String(payload.signal || "analysis")}
          badgeTone={signalStyle}
        />

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr", alignItems: "stretch" }}>
          <Gauge score={score} outlook={String(payload.outlook || "neutral")} change={payload.change as number} compact={isMobile} />
          <div style={{ display: "grid", gap: 14 }}>
            <DecisionCard signal={String(payload.signal || "hold")} summary={decisionSummary} />
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(2, minmax(0, 1fr))" }}>
              <StatChip
                title="Biggest positive"
                value={strongest ? titleCase(strongest.label || strongest.key) : "None"}
                note={strongest ? `Score ${strongest.score ?? "n/a"}${formatChange(strongest.change) ? ` • Change ${formatChange(strongest.change)}` : ""}` : "No supporting factor surfaced"}
                tone={COLORS.cyan}
              />
              <StatChip
                title="Biggest risk"
                value={keyRisk ? titleCase(keyRisk.label || keyRisk.key) : "None"}
                note={keyRisk ? `Score ${keyRisk.score ?? "n/a"}${formatChange(keyRisk.change) ? ` • Change ${formatChange(keyRisk.change)}` : ""}` : "No acute risk surfaced"}
                tone={COLORS.red}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <div style={panelStyle()}>
            <p style={sectionTitleStyle()}>Why now</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: COLORS.text, lineHeight: 1.7 }}>
              {positives.slice(0, 2).map((item) => (
                <li key={String(item.key || item.label)}>
                  Top support: <strong>{titleCase(item.label || item.key)}</strong> is {item.score ?? "n/a"}/100.
                </li>
              ))}
              {keyRisk ? (
                <li>
                  Main pressure point: <strong>{titleCase(keyRisk.label || keyRisk.key)}</strong> at {keyRisk.score ?? "n/a"}/100.
                </li>
              ) : null}
              <li>{decisionSummary}</li>
            </ul>
            <InfoFootnote />
          </div>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
            <div>
              <p style={sectionTitleStyle()}>Strongest positives</p>
              <div style={{ display: "grid", gap: 12 }}>{positives.map((item) => <FactorRow key={String(item.key || item.label)} item={item} />)}</div>
            </div>
            <div>
              <p style={sectionTitleStyle()}>Watch dimensions</p>
              <div style={{ display: "grid", gap: 12 }}>{watch.map((item) => <FactorRow key={String(item.key || item.label)} item={item} tone={COLORS.red} />)}</div>
            </div>
          </div>

          <div>
            <p style={sectionTitleStyle()}>Open full analysis</p>
            <div style={panelStyle()}>
              <div style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.6, marginBottom: 14 }}>
                Want the full Haruspex page? Open the live shared analysis below.
              </div>
              <a href={String(payload.shareUrl || "#")} style={{ color: COLORS.blue, textDecoration: "none", wordBreak: "break-all", fontSize: 15 }}>
                {String(payload.shareUrl || "")}
              </a>
              <InfoFootnote />
            </div>
          </div>
        </div>

        {disclaimer ? <p style={{ color: COLORS.muted2, fontSize: 12, margin: "16px 2px 0" }}>{disclaimer}</p> : null}
      </main>
    );
  }

  if (payload.kind === "watchlist-review") {
    const rows = asArray<WatchlistRow>(payload.rows);
    const movers = asArray<Mover>(payload.biggestMovers);
    const flags = asArray<WatchFlag>(payload.flags);
    return (
      <main style={shellStyle()}>
        <Header title="Watchlist Review" subtitle="Relative strength, pressure points, and top movers across the names you requested." badge={`${rows.length} covered`} />
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", marginBottom: 16 }}>
          <StatChip title="Covered" value={String(rows.length)} note="Tickers with current Haruspex data" tone={COLORS.cyan} />
          <StatChip title="Biggest mover" value={String(movers[0]?.symbol || "—")} note={String(movers[0]?.summary || "No standout move") } tone={COLORS.blue} />
          <StatChip title="Main flag" value={String(flags[0]?.symbol || "—")} note={flags[0] ? `${flags[0].dimension || "watch"} at ${flags[0].score || "n/a"}/100` : "No acute flag surfaced"} tone={COLORS.red} />
        </div>
        <p style={sectionTitleStyle()}>Ranked results</p>
        <MatrixTable
          headers={["Ticker", "Score", "Change", "Signal", "Top driver"]}
          rows={rows.map((row) => [
            String(row.symbol || ""),
            typeof row.score === "number" ? row.score + "/100" : "n/a",
            formatChange(row.change),
            String(row.signal || ""),
            String(row.topDriver || ""),
          ])}
        />
      </main>
    );
  }

  if (payload.kind === "thesis-tracker") {
    const aligned = asArray<DimensionScore>(payload.alignedDimensions);
    const contradictory = asArray<DimensionScore>(payload.contradictoryDimensions);
    return (
      <main style={shellStyle()}>
        <Header title={String(payload.symbol || "Thesis Check")} subtitle={String(payload.summary || "A structured read on whether the latest Haruspex evidence still supports the current case.")} badge={String(payload.verdict || "review")} />
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          <div>
            <p style={sectionTitleStyle()}>Supporting dimensions</p>
            <div style={{ display: "grid", gap: 12 }}>{aligned.map((item) => <FactorRow key={String(item.key || item.label)} item={item} />)}</div>
          </div>
          <div>
            <p style={sectionTitleStyle()}>Contradicting dimensions</p>
            <div style={{ display: "grid", gap: 12 }}>{contradictory.map((item) => <FactorRow key={String(item.key || item.label)} item={item} tone={COLORS.red} />)}</div>
          </div>
        </div>
      </main>
    );
  }

  if (payload.kind === "stock-search") {
    const matches = asArray<Record<string, unknown>>(payload.matches);
    return (
      <main style={shellStyle()}>
        <Header title="Ticker Search" subtitle={`Matching listed symbols for “${String(payload.query || "") }”.`} badge={`${matches.length} matches`} />
        <MatrixTable
          headers={["Ticker", "Company", "Exchange"]}
          rows={matches.map((item) => [String(item.symbol || ""), String(item.name || ""), String(item.exchange || "")])}
        />
      </main>
    );
  }

  return (
    <main style={shellStyle()}>
      <Header title="Haruspex" subtitle="Unsupported widget payload." />
    </main>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
