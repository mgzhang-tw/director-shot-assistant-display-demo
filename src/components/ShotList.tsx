import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { Shot } from "../types";

const status = { ready: "待拍", shooting: "拍攝中", done: "完成", retake: "重拍", skip: "跳過" };
export function ShotList({ shots, currentId, onSelect, onMove }: { shots: Shot[]; currentId: string; onSelect: (id: string) => void; onMove: (offset: number) => void }) {
  return <section className="panel shot-list-panel">
    <div className="panel-heading"><h2>拍攝序列</h2><span>{shots.length} 個鏡位</span></div>
    <div className="shot-list" role="listbox" aria-label="鏡頭清單">
      {shots.map((shot, index) => <button key={shot.id} className={`shot-row ${currentId === shot.id ? "active" : ""}`} onClick={() => onSelect(shot.id)} role="option" aria-selected={currentId === shot.id}>
        <span className="row-index">{String(index + 1).padStart(2, "0")}</span><strong>{shot.sceneNumber}-{shot.shotNumber}</strong><span>{shot.shotSize || "—"}</span><span>{shot.timeOfDay || "—"}</span><b className={`status-${shot.status}`}>{status[shot.status]}</b>
      </button>)}
    </div>
    <div className="list-nav"><button onClick={() => onMove(-1)}><CaretLeft weight="bold" /> 上一鏡位</button><button onClick={() => onMove(1)}>下一鏡位 <CaretRight weight="bold" /></button></div>
  </section>;
}
