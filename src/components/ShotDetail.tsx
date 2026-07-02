import { ChatCircle, Eye, User } from "@phosphor-icons/react";
import type { Shot } from "../types";
import { StoryboardPanel } from "./StoryboardPanel";
import { StatusControls } from "./StatusControls";
const labels = { ready: "準備中", shooting: "拍攝中", done: "完成", retake: "重拍", skip: "跳過", pickup: "補拍", print: "正片" };
export function ShotDetail({ shot, onStatus }: { shot: Shot; onStatus: (status: Shot["status"]) => void }) {
  return <main className="detail">
    <div className="shot-title"><div><span>場次／鏡位</span><h1><b>{shot.sceneNumber}-{shot.shotNumber}</b><em>Scene {shot.sceneNumber} / Shot {shot.shotNumber}</em></h1></div><strong className={`status-${shot.status}`}>{labels[shot.status]}</strong></div>
    <div className="metadata"><div><small>鏡別</small><b>{shot.shotSize || "—"}</b></div><div><small>內外景</small><b>{shot.interiorExterior || "—"}</b></div><div><small>時段</small><b>{shot.timeOfDay || "—"}</b></div><div><small>場景</small><b>{shot.sceneTitle || shot.location || "—"}</b></div><div><small>預估時間</small><b>{shot.estimatedTime || "—"}</b></div></div>
    <StoryboardPanel shot={shot} />
    <p className="description">{shot.description}</p>
    <div className="cues"><div><User /><b>演員提示</b><span>{shot.actorCue || "—"}</span></div><div><ChatCircle /><b>台詞提示</b><span>{shot.dialogueCue || "—"}</span></div><div><Eye /><b>視覺提示</b><span>{shot.visualCue || "—"}</span></div></div>
    <StatusControls current={shot.status} onChange={onStatus} />
  </main>;
}
