import { ArrowsDownUp, ArrowsLeftRight } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sampleShots } from "./data/sampleShots";
import { hasSupabaseConfig, loadCloudProject } from "./lib/supabase";
import type { ProjectData, Shot } from "./types";

const pages = ["分鏡", "鏡頭", "提示"] as const;
const statusLabels = { ready: "待拍", shooting: "拍攝中", done: "完成", retake: "重拍", skip: "跳過" };
const imageFor = (shot: Shot) => shot.storyboardImage && (/^https?:\/\//.test(shot.storyboardImage) || shot.storyboardImage.startsWith("/") || shot.storyboardImage.startsWith("./")) ? shot.storyboardImage : "";

function StoryboardPage({ shot, next }: { shot: Shot; next?: Shot }) {
  const image = imageFor(shot);
  return <div className="compass-content storyboard-view">
    {image ? <img src={image} alt="分鏡參考圖" /> : <div className="compass-placeholder"><b>NO STORYBOARD</b><span>{shot.storyboardImage || "此鏡頭沒有分鏡圖"}</span></div>}
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
  const [shotIndex, setShotIndex] = useState(initial);
  const [pageIndex, setPageIndex] = useState(0);
  const shot = project.shots[shotIndex]!;
  const next = project.shots[shotIndex + 1];
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowRight") setShotIndex((value) => Math.min(project.shots.length - 1, value + 1));
      if (event.key === "ArrowLeft") setShotIndex((value) => Math.max(0, value - 1));
      if (event.key === "ArrowDown") setPageIndex((value) => Math.min(pages.length - 1, value + 1));
      if (event.key === "ArrowUp") setPageIndex((value) => Math.max(0, value - 1));
    };
    addEventListener("keydown", key); return () => removeEventListener("keydown", key);
  }, [project.shots.length]);
  return <div className="compass-hud">
    <nav className="compass-tabs">{pages.map((page, index) => <span key={page} className={pageIndex === index ? "active" : ""}>{page}</span>)}<b>導演模式</b></nav>
    <header className="compass-meta"><div><small>SCENE</small><strong>{shot.sceneNumber}</strong></div><div><small>SHOT</small><strong>{shot.shotNumber}</strong></div><div><small>FORMAT</small><strong>{[shot.interiorExterior, shot.timeOfDay].filter(Boolean).join(" / ") || "—"}</strong></div><div><small>POSITION</small><strong>{shotIndex + 1} / {project.shots.length}</strong></div><b className={`status-${shot.status}`}>{statusLabels[shot.status]}</b></header>
    {pageIndex === 0 ? <StoryboardPage shot={shot} next={next} /> : pageIndex === 1 ? <ShotPage shot={shot} next={next} /> : <CuePage shot={shot} next={next} />}
    <footer className="compass-footer"><div><ArrowsLeftRight size={25} /><span><b>左右換鏡</b><small>切換前後鏡頭</small></span></div><div><ArrowsDownUp size={25} /><span><b>上下換頁</b><small>切換資訊頁面</small></span></div></footer>
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
