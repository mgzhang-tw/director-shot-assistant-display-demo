import { useCallback, useEffect, useMemo, useState } from "react";
import { sampleShots } from "../data/sampleShots";
import type { ImportMeta, ProjectData, Shot, ShotStatus } from "../types";

const KEY = "director-shot-assistant-project";
const initial: ProjectData = { shots: sampleShots, currentShotId: sampleShots[2]!.id, importMeta: null };

export function useProjectData() {
  const [project, setProject] = useState<ProjectData>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "null") || initial; } catch { return initial; }
  });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(project)), [project]);
  const currentIndex = Math.max(0, project.shots.findIndex((shot) => shot.id === project.currentShotId));
  const currentShot = project.shots[currentIndex] ?? null;
  const select = useCallback((id: string) => setProject((value) => ({ ...value, currentShotId: id })), []);
  const move = useCallback((offset: number) => setProject((value) => {
    const index = Math.max(0, value.shots.findIndex((shot) => shot.id === value.currentShotId));
    const next = value.shots[Math.min(value.shots.length - 1, Math.max(0, index + offset))];
    return next ? { ...value, currentShotId: next.id } : value;
  }), []);
  const setStatus = useCallback((status: ShotStatus) => setProject((value) => ({
    ...value, shots: value.shots.map((shot) => shot.id === value.currentShotId ? { ...shot, status } : shot),
  })), []);
  const replace = useCallback((shots: Shot[], importMeta: ImportMeta | null) => setProject({ shots, currentShotId: shots[0]?.id || "", importMeta }), []);
  const progress = useMemo(() => ({ done: project.shots.filter((shot) => shot.status === "done").length, total: project.shots.length }), [project.shots]);
  return { project, currentShot, currentIndex, select, move, setStatus, replace, progress };
}
