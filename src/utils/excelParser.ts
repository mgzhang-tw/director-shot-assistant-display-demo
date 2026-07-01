import * as XLSX from "xlsx";
import type { ImportMeta, Shot } from "../types";
import { mapHeaders, normalizeRow } from "./shotNormalizer";

export async function parseShotFile(file: File): Promise<{ shots: Shot[]; importMeta: ImportMeta }> {
  const data = await file.arrayBuffer();
  const workbook = file.name.toLowerCase().endsWith(".csv")
    ? XLSX.read(new TextDecoder("utf-8").decode(data), { type: "string" })
    : XLSX.read(data, { type: "array" });
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
