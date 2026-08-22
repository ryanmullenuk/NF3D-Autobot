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
        <div className="brand"><span className="bot">NF</span><div><strong>NF3D Auto Bot</strong><small>Etsy-first social publishing</small></div></div>
        <div className="live"><i /> Automation active · 09:00 UK</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">NEWFOREST3D CONTROL CENTRE</p>
          <h1>One catalogue.<br /><em>Every social channel.</em></h1>
          <p className="lede">Select the channels, choose the number of Etsy products and publish. Live Etsy listings remain the single source of truth.</p>
        </div>
        <div className="source-card">
          <span>CATALOGUE SOURCE</span>
          <strong>NewForest3D on Etsy</strong>
          <a href="https://www.etsy.com/uk/shop/NewForest3D" target="_blank">View public shop ↗</a>
          <div className="source-rule"><b>LIVE</b><span>Prices, descriptions and primary images checked at run time</span></div>
        </div>
      </section>

      <section className="control-strip">
        <label><span>Dashboard key</span><input type="password" value={key} onChange={(e) => saveKey(e.target.value)} placeholder="Stored only in this browser" /></label>
        <div><span>Selected output</span><strong>{total} posts</strong></div>
        <button className="run-all" disabled={!!busy || total === 0} onClick={runAll}>{busy ? "Publishing…" : "Run all platforms"}</button>
      </section>

      <section className="platform-grid">
        {(Object.keys(platformMeta) as Platform[]).map((platform) => {
          const meta = platformMeta[platform];
          const item = platforms[platform];
          const ready = status?.[platform]?.configured;
          return (
            <article className={`platform ${item.enabled ? "selected" : ""}`} key={platform}>
              <div className="platform-head">
                <span className={`platform-mark ${meta.colour}`}>{meta.mark}</span>
                <div><h2>{meta.name}</h2><p>{ready === undefined ? "Checking…" : ready ? "Connected" : "Needs setup"}</p></div>
                <button className={`toggle ${item.enabled ? "on" : ""}`} aria-label={`Enable ${meta.name}`} onClick={() => update(platform, { enabled: !item.enabled })}><i /></button>
              </div>
              <p className="platform-note">{meta.note}</p>
              {!ready && status?.[platform]?.missing?.length ? <small className="missing">Missing: {status[platform].missing.join(", ")}</small> : null}
              <div className="platform-actions">
                <div className="stepper"><button onClick={() => update(platform, { count: Math.max(1, item.count - 1) })}>−</button><strong>{item.count}</strong><button onClick={() => update(platform, { count: Math.min(20, item.count + 1) })}>+</button></div>
                <button className="run-one" disabled={!!busy || !item.enabled} onClick={() => run({ [platform]: item.count }, meta.name)}>Run {meta.name}</button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="run-status">
        <div><span className={busy ? "pulse" : "dot"} /><div><strong>Run status</strong><p>{message}</p></div></div>
        <small>The system will stop and record the issue if a platform rejects a publication.</small>
      </section>

      {results.length > 0 && <section className="results"><h2>Latest results</h2>{results.map((result, index) => <pre key={index}>{JSON.stringify(result, null, 2)}</pre>)}</section>}

      <footer><span>NF3D Auto Bot</span><p>Credentials are server-side only and never stored in this public website code.</p></footer>
    </main>
  );
}
