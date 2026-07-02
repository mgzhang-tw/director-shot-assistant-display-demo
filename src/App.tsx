import { useEffect, useState } from "react";
import { CloudArrowUp, Eyeglasses } from "@phosphor-icons/react";
import { ImportPanel } from "./components/ImportPanel";
import { ShotDetail } from "./components/ShotDetail";
import { ShotList } from "./components/ShotList";
import { sampleShots } from "./data/sampleShots";
import { useProjectData } from "./hooks/useProjectData";
import { createProjectCode, hasSupabaseConfig, loadCloudProject, saveCloudProject } from "./lib/supabase";

export default function App() {
  const { project, currentShot, select, move, setStatus, replace, progress } = useProjectData();
  const urlProjectCode = new URLSearchParams(window.location.search).get("project")?.toUpperCase() || "";
  const [projectCode] = useState(() => urlProjectCode || localStorage.getItem("director-shot-project-code") || createProjectCode());
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [loadState, setLoadState] = useState<"idle" | "loading" | "done" | "missing" | "error">("idle");
  useEffect(() => localStorage.setItem("director-shot-project-code", projectCode), [projectCode]);
  useEffect(() => {
    if (!urlProjectCode || !hasSupabaseConfig) return;
    let cancelled = false;
    setLoadState("loading");
    loadCloudProject(urlProjectCode)
      .then((cloudProject) => {
        if (cancelled) return;
        if (!cloudProject?.shots?.length) { setLoadState("missing"); return; }
        replace(cloudProject.shots, cloudProject.importMeta ?? null);
        setLoadState("done");
      })
      .catch(() => { if (!cancelled) setLoadState("error"); });
    return () => { cancelled = true; };
  }, [replace, urlProjectCode]);
  const syncToGlasses = async () => {
    setSyncState("syncing");
    try { await saveCloudProject(projectCode, project); setSyncState("done"); }
    catch { setSyncState("error"); }
  };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input, textarea, select")) return;
      const statusKeys = { d: "done", r: "retake", s: "shooting", k: "skip" } as const;
      if (["ArrowUp", "ArrowLeft"].includes(event.key)) { event.preventDefault(); move(-1); }
      if (["ArrowDown", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(1); }
      const target = statusKeys[event.key.toLowerCase() as keyof typeof statusKeys]; if (target) setStatus(target);
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [move, setStatus]);
  return <div className="app-shell">
    <header><div><h1>導演監看器</h1><span>CONTROL</span></div><p>匯入 Excel 後同步至眼鏡；不使用眼鏡相機或麥克風。</p></header>
    <section className="sync-bar">
      <div><Eyeglasses size={22} /><span><small>眼鏡專案代碼</small><strong>{projectCode}</strong></span></div>
      <code>/glasses?project={projectCode}</code>
      <button onClick={syncToGlasses} disabled={!hasSupabaseConfig || syncState === "syncing"}><CloudArrowUp size={20} />{!hasSupabaseConfig ? "尚未設定 Supabase" : syncState === "syncing" ? "同步中…" : syncState === "done" ? "已同步到眼鏡" : syncState === "error" ? "同步失敗，重試" : "同步到眼鏡"}</button>
      {urlProjectCode && <span className={`load-state load-${loadState}`}>{loadState === "loading" ? "讀取雲端專案中…" : loadState === "done" ? "已載入雲端專案" : loadState === "missing" ? "找不到此專案代碼" : loadState === "error" ? "雲端讀取失敗" : ""}</span>}
      <a href={`?mode=glasses&project=${projectCode}`} target="_blank">開啟眼鏡版</a>
    </section>
    <div className="workspace"><aside><ImportPanel meta={project.importMeta} total={progress.total} done={progress.done} onImport={replace} onSample={() => replace(sampleShots, null)} /><ShotList shots={project.shots} currentId={project.currentShotId} onSelect={select} onMove={move} /></aside>{currentShot ? <ShotDetail shot={currentShot} onStatus={setStatus} /> : <div className="empty-app">請先匯入拍攝表</div>}</div>
  </div>;
}
