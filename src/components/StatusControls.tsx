import { ArrowClockwise, Check, Circle, Flag, Play } from "@phosphor-icons/react";
import type { ShotStatus } from "../types";
const controls: { id: ShotStatus; label: string; icon: typeof Play }[] = [
  { id: "ready", label: "準備中", icon: Play }, { id: "shooting", label: "拍攝中", icon: Circle }, { id: "done", label: "完成", icon: Check }, { id: "retake", label: "重拍", icon: ArrowClockwise }, { id: "skip", label: "跳過", icon: Flag },
];
export function StatusControls({ current, onChange }: { current: ShotStatus; onChange: (status: ShotStatus) => void }) {
  return <div className="status-controls">{controls.map(({ id, label, icon: Icon }) => <button key={id} className={`control-${id} ${current === id ? "selected" : ""}`} onClick={() => onChange(id)}><Icon weight="bold" />{label}</button>)}</div>;
}
