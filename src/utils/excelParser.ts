import * as XLSX from "xlsx";
import type { ImportMeta, Shot } from "../types";
import { mapHeaders, normalizeRow } from "./shotNormalizer";

type ParseResult = { shots: Shot[]; importMeta: ImportMeta };

const cleanText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const compact = (value: unknown) => cleanText(value).toLowerCase().replace(/[\s_\-/　]+/g, "");
const isMeaningful = (value: unknown) => cleanText(value).replace(/[—–\-]/g, "").trim().length > 0;

function normalizeInteriorExterior(value: unknown): "INT" | "EXT" | "" {
  const text = cleanText(value).toUpperCase();
  if (text.includes("外") || text.includes("EXT")) return "EXT";
  if (text.includes("內") || text.includes("INT")) return "INT";
  return "";
}

function normalizeSceneNumber(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";
  return text.replace(/\.0$/, "");
}

function normalizeShotNumber(value: unknown, fallback: string) {
  const text = cleanText(value);
  if (!text) return fallback;

  // TheEdge 大表常把「3-2」這類鏡號誤存成 Excel 日期，XLSX 讀出來會變成
  // 2026-03-02 / 3/2/26 / 2026-03-02 00:00:00。這裡轉回導演現場會看的鏡號。
  const isoDate = text.match(/^20\d{2}[-/](\d{1,2})[-/](\d{1,2})(?:\s+00:00:00)?$/);
  if (isoDate) return `${Number(isoDate[1])}-${Number(isoDate[2])}`;
  const shortDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(?:20)?\d{2}$/);
  if (shortDate) return `${Number(shortDate[1])}-${Number(shortDate[2])}`;

  if (/^\d+$/.test(text)) return text.padStart(2, "0");
  return text.replace(/\.0$/, "");
}

function joinParts(parts: Array<unknown>, separator = "｜") {
  return parts.map(cleanText).filter(Boolean).join(separator);
}

function findHeaderIndex(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const cells = row.map(compact);
    return cells.some((cell) => cell.includes("預計拍攝時間"))
      && cells.some((cell) => cell === "場" || cell.includes("scene"))
      && cells.some((cell) => cell.includes("內容") || cell.includes("scenedescription"));
  });
}

function columnIndex(header: unknown[], candidates: string[], startAt = 0) {
  const normalized = header.map(compact);
  const exact = normalized.findIndex((cell, index) => index >= startAt && candidates.some((candidate) => cell === compact(candidate)));
  if (exact >= 0) return exact;
  return normalized.findIndex((cell, index) => index >= startAt && candidates.some((candidate) => cell.includes(compact(candidate))));
}

function collectCast(header: unknown[], row: unknown[], start: number, end: number) {
  const cast: string[] = [];
  for (let index = start; index <= end; index += 1) {
    const actor = cleanText(header[index]);
    const mark = cleanText(row[index]);
    if (actor && mark) cast.push(`${actor}${mark === "A" || mark === "B" ? `(${mark})` : `：${mark}`}`);
  }
  return cast.join("、");
}

function parseTheEdgePlanSheet(workbook: XLSX.WorkBook, fileName: string): ParseResult | null {
  const candidates = workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
    const headerIndex = findHeaderIndex(rows);
    if (headerIndex < 0) return [];
    const header = rows[headerIndex] ?? [];
    const shotIndex = columnIndex(header, ["鏡號", "鏡數", "shot"], 0);
    const descriptionIndex = columnIndex(header, ["內容", "scene description", "description"], 0);
    const shotRows = rows.slice(headerIndex + 1).filter((row) => {
      const scene = row[columnIndex(header, ["場", "scene"], 0)];
      const description = row[descriptionIndex];
      const shot = shotIndex >= 0 ? row[shotIndex] : "";
      return isMeaningful(scene) && isMeaningful(description) && !compact(scene).includes("day") && (isMeaningful(shot) || sheetName.includes("順場"));
    }).length;
    const score = 100 + shotRows * 10 + (sheetName.includes("拍攝計劃") ? 80 : 0) + (sheetName.includes("雨備") ? 20 : 0) - (sheetName.includes("順場") ? 60 : 0);
    return [{ sheetName, rows, headerIndex, score, shotRows }];
  }).sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best || best.shotRows === 0) return null;

  const rows = best.rows;
  const header = rows[best.headerIndex] ?? [];
  const iScheduleTime = columnIndex(header, ["預計拍攝時間"]);
  const iDramaTime = columnIndex(header, ["戲劇時間", "time"], 1);
  const iScene = columnIndex(header, ["場", "scene"], 0);
  const iShootLocation = columnIndex(header, ["拍攝地點"]);
  const iStoryLocation = columnIndex(header, ["劇中場景", "location"]);
  const iDayNight = columnIndex(header, ["光", "dn"]);
  const iIntExt = columnIndex(header, ["ie", "內外景", "景"]);
  const iPage = columnIndex(header, ["頁", "p"]);
  const iShot = columnIndex(header, ["鏡號", "鏡數", "shot"]);
  const iDescription = columnIndex(header, ["內容", "scene description", "description"]);
  const iSupportRole = columnIndex(header, ["其他角色", "support role"]);
  const iCostume = columnIndex(header, ["造型梳化服", "costume"]);
  const iSpecialMakeup = columnIndex(header, ["特殊化妝", "specialmakeup"]);
  const iSpecialProps = columnIndex(header, ["特殊道具", "specialprops"]);
  const iProps = columnIndex(header, ["戲用陳設", "戲用道具", "props"]);

  const castStart = iDescription + 1;
  const castEnd = Math.max(castStart, (iSupportRole > 0 ? iSupportRole : castStart + 3) - 1);

  const shots = rows.slice(best.headerIndex + 1).flatMap((row, offset): Shot[] => {
    const scene = normalizeSceneNumber(row[iScene]);
    const description = cleanText(row[iDescription]);
    if (!scene || !description) return [];
    if (compact(scene).includes("day")) return [];
    const hasShot = iShot >= 0 && isMeaningful(row[iShot]);
    if (!hasShot && !best.sheetName.includes("順場")) return [];

    const sourceRow = best.headerIndex + offset + 2;
    const shotNumber = normalizeShotNumber(row[iShot], String(sourceRow).padStart(2, "0"));
    const dramaTime = cleanText(row[iDramaTime]);
    const scheduleTime = cleanText(row[iScheduleTime]);
    const shootLocation = cleanText(row[iShootLocation]);
    const storyLocation = cleanText(row[iStoryLocation]);
    const supportRole = cleanText(row[iSupportRole]);
    const cast = joinParts([collectCast(header, row, castStart, castEnd), supportRole], "、");
    const costume = cleanText(row[iCostume]);
    const specialMakeup = cleanText(row[iSpecialMakeup]);
    const specialProps = cleanText(row[iSpecialProps]);
    const props = joinParts([specialProps, cleanText(row[iProps])], "、");
    const page = cleanText(row[iPage]);

    return [{
      id: `${scene}-${shotNumber}-${sourceRow}`,
      sceneNumber: scene,
      shotNumber,
      sceneTitle: storyLocation,
      location: shootLocation || storyLocation,
      timeOfDay: cleanText(row[iDayNight]),
      interiorExterior: normalizeInteriorExterior(row[iIntExt]),
      description,
      storyboardImage: "",
      storyboardNote: joinParts([dramaTime && `戲劇時間 ${dramaTime}`, page && `頁數 ${page}`]),
      dialogueCue: description.includes("：") || description.includes(":") ? description : "",
      actorCue: cast,
      visualCue: joinParts([scheduleTime && `預計 ${scheduleTime}`, shootLocation && `拍攝地 ${shootLocation}`]),
      props,
      characters: cast,
      departmentNote: joinParts([costume && `服化 ${costume}`, specialMakeup && `特化 ${specialMakeup}`, props && `道具 ${props}`]),
      estimatedTime: scheduleTime,
      status: "ready",
      sourceRow,
    }];
  });

  if (!shots.length) return null;
  return {
    shots,
    importMeta: {
      fileName,
      sheetName: best.sheetName,
      sheetCount: workbook.SheetNames.length,
      totalRows: best.shotRows,
      mappedFields: ["theedge-production-plan", "sceneNumber", "shotNumber", "estimatedTime", "location", "timeOfDay", "interiorExterior", "description", "characters", "props", "departmentNote"],
      unmappedColumns: [],
      importedAt: new Date().toISOString(),
    },
  };
}

function findGenericHeaderIndex(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const cells = row.map(compact);
    const hasShot = cells.some((cell) => cell === "鏡號" || cell === "shot" || cell === "shotno");
    const hasDescription = cells.some((cell) => cell === "內容" || cell.includes("description") || cell.includes("畫面"));
    const hasTimeOrScene = cells.some((cell) => cell.includes("預估時間") || cell === "場景" || cell.includes("location"));
    return hasShot && hasDescription && hasTimeOrScene;
  });
}

function parseGenericHeaderSheet(workbook: XLSX.WorkBook, fileName: string): ParseResult | null {
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;
  if (!sheetName || !sheet) return null;

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  const headerIndex = findGenericHeaderIndex(matrix);
  if (headerIndex < 0) return null;

  const headers = (matrix[headerIndex] ?? []).map((header, index) => cleanText(header) || `__EMPTY_${index}`);
  const { mapping, unmappedColumns } = mapHeaders(headers);
  const bodyRows = matrix.slice(headerIndex + 1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
  const shots = bodyRows
    .filter((row) => {
      const shotHeader = mapping.shotNumber;
      return Boolean(shotHeader && isMeaningful(row[shotHeader]));
    })
    .map((row, index) => normalizeRow(row, mapping, headerIndex + index + 1))
    .filter((shot) => {
      const description = shot.description.replace("此鏡頭尚未填寫畫面內容", "").trim();
      return Boolean(shot.shotNumber && (description || shot.sceneTitle || shot.estimatedTime));
    });

  if (!shots.length) return null;
  return {
    shots,
    importMeta: {
      fileName,
      sheetName,
      sheetCount: workbook.SheetNames.length,
      totalRows: shots.length,
      mappedFields: Object.keys(mapping),
      unmappedColumns,
      importedAt: new Date().toISOString(),
    },
  };
}

export async function parseShotFile(file: File): Promise<{ shots: Shot[]; importMeta: ImportMeta }> {
  const data = await file.arrayBuffer();
  const workbook = file.name.toLowerCase().endsWith(".csv")
    ? XLSX.read(new TextDecoder("utf-8").decode(data), { type: "string" })
    : XLSX.read(data, { type: "array" });
  const theEdgePlan = parseTheEdgePlanSheet(workbook, file.name);
  if (theEdgePlan) return theEdgePlan;
  const genericHeaderSheet = parseGenericHeaderSheet(workbook, file.name);
  if (genericHeaderSheet) return genericHeaderSheet;

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("檔案內沒有可讀取的工作表");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]!, { defval: "" });
  if (!rows.length) throw new Error("工作表沒有資料列");
  const headers = Object.keys(rows[0]!);
  const { mapping, unmappedColumns } = mapHeaders(headers);
  const shots = rows.map((row, index) => normalizeRow(row, mapping, index));
  return {
    shots,
    importMeta: {
      fileName: file.name, sheetName, sheetCount: workbook.SheetNames.length, totalRows: rows.length,
      mappedFields: Object.keys(mapping), unmappedColumns, importedAt: new Date().toISOString(),
    },
  };
}
