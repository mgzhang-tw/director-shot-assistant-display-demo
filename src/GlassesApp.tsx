import { ArrowsDownUp, ArrowsLeftRight } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sampleShots } from "./data/sampleShots";
import { hasSupabaseConfig, loadCloudProject } from "./lib/supabase";
import type { ProjectData, Shot, ShotStatus } from "./types";

const pages = ["分鏡", "鏡頭", "提示"] as const;
const statusLabels = { ready: "待拍", shooting: "拍攝中", done: "已拍攝完畢", retake: "重拍", skip: "跳過", pickup: "補拍", print: "正片" };
const statusOptions: { value: ShotStatus; label: string; note: string }[] = [
  { value: "shooting", label: "拍攝中", note: "目前正在拍攝" },
  { value: "done", label: "已拍攝完畢", note: "鏡頭已完成" },
  { value: "pickup", label: "補拍", note: "仍缺畫面或需追加" },
  { value: "print", label: "正片", note: "選定可用 Take" },
];
const imageFor = (shot: Shot) => shot.storyboardImage && (/^https?:\/\//.test(shot.storyboardImage) || shot.storyboardImage.startsWith("/") || shot.storyboardImage.startsWith("./")) ? shot.storyboardImage : "";

function StoryboardPage({ shot, next }: { shot: Shot; next?: Shot }) {
  const image = imageFor(shot);
  return <div className="compass-content storyboard-view">
    {image ? <img src={image} alt="分鏡參考圖" loading="eager" decoding="async" fetchPriority="high" /> : <div className="compass-placeholder"><b>NO STORYBOARD</b><span>{shot.storyboardImage || "此鏡頭沒有分鏡圖"}</span></div>}
    <p className="compass-description">{shot.description}</p>
    <div className="compass-lower"><div className="quick-cues"><p><b>演員</b><span>{shot.actorCue || "—"}</span></p><p><b>視覺</b><span>{shot.visualCue || "—"}</span></p></div><div className="compass-next"><small>NEXT SHOT</small><strong>{next ? `${next.sceneNumber}-${next.shotNumber}` : "END"}</strong><span>{next?.shotSize || "—"}｜{next?.sceneTitle || next?.location || "今日鏡頭結束"}</span></div></div>
  </div>;
}

function ShotPage({ shot, next }: { shot: Shot; next?: Shot }) {
  return <div className="compass-content info-view"><h2>{shot.description}</h2><div className="compass-info-grid"><div><small>場景</small><b>{shot.sceneTitle || "—"}</b></div><div><small>地點</small><b>{shot.location || "—"}</b></div><div><small>運鏡</small><b>{shot.cameraMovement || "—"}</b></div><div><small>預估時間</small><b>{shot.estimatedTime || "—"}</b></div><div><small>角色</small><b>{shot.characters || "—"}</b></div><div><small>道具</small><b>{shot.props || "—"}</b></div></div><div className="compass-note"><small>部門備註</small><p>{shot.departmentNote || "此鏡頭沒有部門備註"}</p></div><div className="inline-next">下一鏡　<strong>{next ? `${next.sceneNumber}-${next.shotNumber}` : "END"}</strong>　{next?.sceneTitle || "今日鏡頭結束"}</div></div>;
}

function CuePage({ shot, next }: { shot: Shot; next?: Shot }) {
  return <div className="compass-content cue-view"><div><small>演員提示</small><p>{shot.actorCue || "—"}</p></div><div><small>台詞提示</small><p>{shot.dialogueCue || "—"}</p></div><div><small>視覺提示</small><p>{shot.visualCue || "—"}</p></div><div className="inline-next">下一鏡　<strong>{next ? `${next.sceneNumber}-${next.shotNumber}` : "END"}</strong>　{next?.sceneTitle || "今日鏡頭結束"}</div></div>;
}

function CompassHUD({ project }: { project: ProjectData }) {
  const initial = Math.max(0, project.shots.findIndex((shot) => shot.id === project.currentShotId));
  const [shots, setShots] = useState<Shot[]>(() => {
    try { const saved = localStorage.getItem("director-shot-demo-statuses"); if (saved) { const values = JSON.parse(saved) as Record<string, ShotStatus>; return project.shots.map((shot) => values[shot.id] ? { ...shot, status: values[shot.id]! } : shot); } } catch { /* use project defaults */ }
    return project.shots;
  });
  const [shotIndex, setShotIndex] = useState(initial);
  const [pageIndex, setPageIndex] = useState(0);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const shot = shots[shotIndex]!;
  const next = shots[shotIndex + 1];
  const openStatus = () => { const index = statusOptions.findIndex((option) => option.value === shot.status); setStatusIndex(index >= 0 ? index : 0); setStatusOpen(true); };
  const confirmStatus = () => { const selected = statusOptions[statusIndex]!; setShots((current) => current.map((item, index) => index === shotIndex ? { ...item, status: selected.value } : item)); setStatusOpen(false); };
  useEffect(() => { const values = Object.fromEntries(shots.map((item) => [item.id, item.status])); localStorage.setItem("director-shot-demo-statuses", JSON.stringify(values)); }, [shots]);
  useEffect(() => { [shots[shotIndex - 1], shots[shotIndex + 1]].forEach((item) => { if (!item) return; const src = imageFor(item); if (src) { const image = new Image(); image.src = src; } }); }, [shotIndex, shots]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Enter", "Escape"].includes(event.key)) event.preventDefault();
      if (statusOpen) {
        if (event.key === "ArrowDown" || event.key === "ArrowRight") setStatusIndex((value) => Math.min(statusOptions.length - 1, value + 1));
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") setStatusIndex((value) => Math.max(0, value - 1));
        if (event.key === "Enter") confirmStatus();
        if (event.key === "Escape") setStatusOpen(false);
        return;
      }
      if (event.key === "ArrowDown") setShotIndex((value) => Math.min(shots.length - 1, value + 1));
      if (event.key === "ArrowUp") setShotIndex((value) => Math.max(0, value - 1));
      if (event.key === "ArrowRight") setPageIndex((value) => Math.min(pages.length - 1, value + 1));
      if (event.key === "ArrowLeft") setPageIndex((value) => Math.max(0, value - 1));
      if (event.key === "Enter") openStatus();
    };
    addEventListener("keydown", key); return () => removeEventListener("keydown", key);
  }, [shotIndex, shots, statusIndex, statusOpen]);
  return <div className="compass-hud focusable" onDoubleClick={() => statusOpen ? confirmStatus() : openStatus()}>
    <nav className="compass-tabs">{pages.map((page, index) => <span key={page} className={pageIndex === index ? "active" : ""}>{page}</span>)}<b>導演模式</b></nav>
    <header className="compass-meta"><div><small>SCENE</small><strong>{shot.sceneNumber}</strong></div><div><small>SHOT</small><strong>{shot.shotNumber}</strong></div><div><small>FORMAT</small><strong>{[shot.interiorExterior, shot.timeOfDay].filter(Boolean).join(" / ") || "—"}</strong></div><div><small>POSITION</small><strong>{shotIndex + 1} / {project.shots.length}</strong></div><b className={`status-${shot.status}`}>{statusLabels[shot.status]}</b></header>
    {pageIndex === 0 ? <StoryboardPage shot={shot} next={next} /> : pageIndex === 1 ? <ShotPage shot={shot} next={next} /> : <CuePage shot={shot} next={next} />}
    <footer className="compass-footer"><div><ArrowsLeftRight size={25} /><span><b>左右換頁</b><small>切換資訊頁面</small></span></div><div><ArrowsDownUp size={25} /><span><b>上下換鏡</b><small>切換前後鏡頭</small></span></div><em>雙擊｜狀態</em></footer>
    {statusOpen && <div className="status-overlay"><header><span>設定拍攝狀態</span><small>上下選擇・雙擊確認</small></header><div>{statusOptions.map((option, index) => <button key={option.value} className={index === statusIndex ? "active" : ""}><b>{index + 1}</b><span><strong>{option.label}</strong><small>{option.note}</small></span></button>)}</div></div>}
  </div>;
}

export function GlassesApp() {
  const code = new URLSearchParams(location.search).get("project")?.toUpperCase() || "";
  const demo = useMemo<ProjectData>(() => ({ shots: sampleShots, currentShotId: sampleShots[2]!.id, importMeta: null }), []);
  const [project, setProject] = useState<ProjectData | null>(code === "DEMO" || !code ? demo : null);
  const [message, setMessage] = useState(code ? "正在讀取專案…" : "DEMO MODE");
  const refresh = useCallback(async () => { if (!code || code === "DEMO") return; try { const data = await loadCloudProject(code); setProject(data); setMessage(data ? "" : hasSupabaseConfig ? "找不到專案" : "尚未設定雲端連線"); } catch { setMessage("同步失敗，請檢查網路"); } }, [code]);
  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 5000); return () => clearInterval(timer); }, [refresh]);
  if (!project?.shots.length) return <main className="glasses-screen glasses-message"><strong>{message}</strong><span>{code && `PROJECT ${code}`}</span></main>;
  return <main className="glasses-screen"><CompassHUD project={project} /></main>;
}
