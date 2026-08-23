"use client";

import { useEffect, useMemo, useState } from "react";

type Platform = "instagram" | "pinterest" | "facebook" | "x" | "tiktok";
type PlatformState = { enabled: boolean; count: number };
type ConfigStatus = { configured: boolean; missing: string[] };

const platformMeta: Record<Platform, { name: string; mark: string; colour: string; note: string }> = {
  instagram: { name: "Instagram", mark: "IG", colour: "coral", note: "Feed photo with Etsy caption and shop route" },
  pinterest: { name: "Pinterest", mark: "P", colour: "red", note: "SEO title, description, board and destination link" },
  facebook: { name: "Facebook", mark: "f", colour: "blue", note: "Page photo post with direct Etsy link" },
  x: { name: "X", mark: "X", colour: "black", note: "Image post kept within the character limit" },
  tiktok: { name: "TikTok", mark: "TT", colour: "cyan", note: "Photo post through the Content Posting API" },
};

const initialState: Record<Platform, PlatformState> = {
  instagram: { enabled: true, count: 5 },
  pinterest: { enabled: true, count: 5 },
  facebook: { enabled: true, count: 5 },
  x: { enabled: true, count: 5 },
  tiktok: { enabled: false, count: 5 },
};

export default function Dashboard() {
  const [platforms, setPlatforms] = useState(initialState);
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<Record<Platform, ConfigStatus> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("Ready when you are.");
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    Promise.resolve(window.localStorage.getItem("nf3d-dashboard-key") || "").then(setKey);
    fetch("/api/status").then((r) => r.json()).then((d) => setStatus(d.platforms)).catch(() => null);
  }, []);

  const total = useMemo(
    () => Object.values(platforms).reduce((sum, p) => sum + (p.enabled ? p.count : 0), 0),
    [platforms],
  );

  function update(platform: Platform, patch: Partial<PlatformState>) {
    setPlatforms((current) => ({ ...current, [platform]: { ...current[platform], ...patch } }));
  }

  function saveKey(value: string) {
    setKey(value);
    window.localStorage.setItem("nf3d-dashboard-key", value);
  }

  async function run(counts: Partial<Record<Platform, number>>, label: string) {
    if (!key) {
      setMessage("Enter your dashboard key before running a campaign.");
      return;
    }
    setBusy(label);
    setMessage(`Starting ${label}…`);
    setResults([]);
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dashboard-key": key },
        body: JSON.stringify({ counts }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The run could not be started.");
      setResults(data.posts || []);
      setMessage(`${data.summary?.succeeded || 0} published, ${data.summary?.failed || 0} failed, ${data.summary?.skipped || 0} skipped.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The run failed.");
    } finally {
      setBusy(null);
    }
  }

  function runAll() {
    const counts = Object.fromEntries(
      (Object.entries(platforms) as [Platform, PlatformState][]).filter(([, value]) => value.enabled).map(([name, value]) => [name, value.count]),
    ) as Partial<Record<Platform, number>>;
    return run(counts, "all enabled platforms");
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="bot">NF</span><div><strong>NF3D Auto Bot</strong><small>Social publishing workspace</small></div></div>
        <nav className="topnav" aria-label="Dashboard sections"><a href="#platforms">Campaign</a><a href="#status">Activity</a></nav>
        <div className="live"><i /> Next run 09:00 UK</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">NEWFOREST3D AUTOMATION</p>
          <h1>Your Etsy catalogue.<br /><em>Ready to publish.</em></h1>
          <p className="lede">Create product posts for every social channel from one calm, simple workspace. Live Etsy details remain your single source of truth.</p>
          <a className="hero-jump" href="#platforms">Create a campaign <span>→</span></a>
        </div>
        <div className="hero-panel">
          <span className="panel-label">AUTOMATION OVERVIEW</span>
          <div className="panel-row"><span>Catalogue</span><strong>NewForest3D on Etsy</strong></div>
          <div className="panel-row"><span>Schedule</span><strong>Daily at 09:00</strong></div>
          <div className="panel-row"><span>Channels ready</span><strong>{Object.values(platforms).filter((item) => item.enabled).length} of 5</strong></div>
          <a href="https://www.etsy.com/uk/shop/NewForest3D" target="_blank" rel="noreferrer">View public Etsy shop <span>↗</span></a>
        </div>
      </section>

      <section className="source-bar">
        <div><span className="source-icon">E</span><p><small>PRODUCT SOURCE</small><strong>Public Etsy catalogue</strong></p></div>
        <p>Every run checks live titles, prices, descriptions, availability and primary images before publishing.</p>
        <span className="verified"><i /> Live verification enabled</span>
      </section>

      <section className="control-strip" id="platforms">
        <label><span>Dashboard key</span><input type="password" value={key} onChange={(e) => saveKey(e.target.value)} placeholder="Stored only in this browser" /></label>
        <div className="output-count"><span>Selected output</span><strong>{total} <small>posts</small></strong></div>
        <button className="run-all" disabled={!!busy || total === 0} onClick={runAll}><span>{busy ? "Publishing…" : "Run all platforms"}</span><b>→</b></button>
      </section>

      <section className="platform-grid">
        {(Object.keys(platformMeta) as Platform[]).map((platform) => {
          const meta = platformMeta[platform];
          const item = platforms[platform];
          const ready = status?.[platform]?.configured;
          return (
            <article className={`platform ${meta.colour} ${item.enabled ? "selected" : ""}`} key={platform}>
              <div className="platform-head">
                <span className={`platform-mark ${meta.colour}`}>{meta.mark}</span>
                <div><h2>{meta.name}</h2><p>{ready === undefined ? "Checking…" : ready ? "Connected" : "Needs setup"}</p></div>
                <button className={`toggle ${item.enabled ? "on" : ""}`} aria-pressed={item.enabled} aria-label={`Enable ${meta.name}`} onClick={() => update(platform, { enabled: !item.enabled })}><i /></button>
              </div>
              <p className="platform-note">{meta.note}</p>
              {!ready && status?.[platform]?.missing?.length ? <small className="missing">Missing: {status[platform].missing.join(", ")}</small> : null}
              <div className="platform-actions">
                <div className="stepper"><button onClick={() => update(platform, { count: Math.max(1, item.count - 1) })}>−</button><strong>{item.count}</strong><button onClick={() => update(platform, { count: Math.min(20, item.count + 1) })}>+</button></div>
                <button className="run-one" disabled={!!busy || !item.enabled} onClick={() => run({ [platform]: item.count }, meta.name)}>Run {meta.name} <span>→</span></button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="run-status" id="status">
        <div><span className={busy ? "pulse" : "dot"} /><div><strong>Run status</strong><p>{message}</p></div></div>
        <small>The system will stop and record the issue if a platform rejects a publication.</small>
      </section>

      {results.length > 0 && <section className="results"><h2>Latest results</h2>{results.map((result, index) => <pre key={index}>{JSON.stringify(result, null, 2)}</pre>)}</section>}

      <footer><span>NF3D Auto Bot</span><p>Credentials stay server-side and are never stored in this public website code.</p><div className="footer-links"><a href="/privacy">Privacy</a><a href="#platforms">Back to campaign</a></div></footer>
    </main>
  );
}
