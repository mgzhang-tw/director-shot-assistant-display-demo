import type { Shot } from "../types";

export const FIELD_ALIASES: Record<keyof Omit<Shot, "id" | "status" | "sourceRow">, string[]> = {
  sceneNumber: ["場次", "場", "scene", "scene no", "scene number", "場景"],
  shotNumber: ["鏡號", "鏡次", "shot", "shot no", "鏡頭", "分鏡"],
  sceneTitle: ["場景名稱", "場次名稱", "scene title", "場名"],
  location: ["地點", "場景地", "location", "拍攝地點"],
  timeOfDay: ["日夜", "時間", "time", "day/night", "時段"],
  interiorExterior: ["內外", "內外景", "int/ext", "interior/exterior"],
  shotSize: ["景別", "shot size", "size"],
  cameraMovement: ["運鏡", "鏡位", "camera", "camera movement", "movement"],
  description: ["畫面", "畫面內容", "內容", "動作", "description", "action", "shot description"],
  storyboardImage: ["分鏡圖", "storyboard", "storyboard image", "image", "圖片", "圖"],
  storyboardNote: ["分鏡備註", "storyboard note"],
  dialogueCue: ["台詞", "台詞提示", "dialogue", "line", "cue"],
  actorCue: ["演員提示", "表演提示", "actor cue", "performance", "表演", "情緒"],
  visualCue: ["視覺", "視覺提示", "visual", "visual cue", "色調", "光線", "構圖"],
  props: ["道具", "props", "prop"],
  characters: ["角色", "演員", "人物", "character", "characters", "cast"],
  departmentNote: ["備註", "notes", "note", "部門備註", "美術備註", "攝影備註", "收音備註"],
  estimatedTime: ["預估時間", "拍攝時間", "estimated time", "duration", "time needed"],
};

const clean = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/[\s_\-/]+/g, "");

const similarity = (a: string, b: string) => {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.88;
  const chars = [...new Set(a)];
  return chars.filter((char) => b.includes(char)).length / Math.max(a.length, b.length, 1);
};

export function mapHeaders(headers: string[]) {
  const mapping: Partial<Record<keyof Shot, string>> = {};
  const used = new Set<string>();
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    let best: { header: string; score: number } | null = null;
    for (const header of headers) {
      const score = Math.max(...aliases.map((alias) => similarity(clean(header), clean(alias))));
      if (score >= 0.72 && (!best || score > best.score)) best = { header, score };
    }
    if (best && !used.has(best.header)) {
      mapping[field as keyof Shot] = best.header;
      used.add(best.header);
    }
  }
  return { mapping, unmappedColumns: headers.filter((header) => !used.has(header)) };
}

export function normalizeRow(row: Record<string, unknown>, mapping: Partial<Record<keyof Shot, string>>, index: number): Shot {
  const get = (field: keyof Shot) => String(mapping[field] ? row[mapping[field]!] ?? "" : "").trim();
  const sceneNumber = get("sceneNumber") || "—";
  const rawShotNumber = get("shotNumber");
  const shotNumber = rawShotNumber ? (/^\d+$/.test(rawShotNumber) ? rawShotNumber.padStart(2, "0") : rawShotNumber) : String(index + 1).padStart(2, "0");
  const intExt = get("interiorExterior").toUpperCase();
  return {
    id: `${sceneNumber}-${shotNumber}-${index}`,
    sceneNumber,
    shotNumber,
    sceneTitle: get("sceneTitle"), location: get("location"), timeOfDay: get("timeOfDay"),
    interiorExterior: intExt.includes("EXT") || intExt.includes("外") ? "EXT" : intExt.includes("INT") || intExt.includes("內") ? "INT" : "",
    shotSize: get("shotSize"), cameraMovement: get("cameraMovement"),
    description: get("description") || "此鏡頭尚未填寫畫面內容",
    storyboardImage: get("storyboardImage"), storyboardNote: get("storyboardNote"), dialogueCue: get("dialogueCue"),
    actorCue: get("actorCue"), visualCue: get("visualCue"), props: get("props"), characters: get("characters"),
    departmentNote: get("departmentNote"), estimatedTime: get("estimatedTime"), status: "ready", sourceRow: index,
  };
}
