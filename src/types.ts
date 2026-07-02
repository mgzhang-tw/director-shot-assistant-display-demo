export type ShotStatus = "ready" | "shooting" | "done" | "retake" | "skip" | "pickup" | "print";

export type Shot = {
  id: string;
  sceneNumber: string;
  shotNumber: string;
  sceneTitle?: string;
  location?: string;
  timeOfDay?: string;
  interiorExterior?: "INT" | "EXT" | "";
  shotSize?: string;
  cameraMovement?: string;
  description: string;
  storyboardImage?: string;
  storyboardNote?: string;
  dialogueCue?: string;
  actorCue?: string;
  visualCue?: string;
  props?: string;
  characters?: string;
  departmentNote?: string;
  estimatedTime?: string;
  status: ShotStatus;
  sourceRow: number;
};

export type ImportMeta = {
  fileName: string;
  sheetName: string;
  sheetCount: number;
  totalRows: number;
  mappedFields: string[];
  unmappedColumns: string[];
  importedAt: string;
};

export type ProjectData = {
  shots: Shot[];
  currentShotId: string;
  importMeta: ImportMeta | null;
};
