import * as XLSX from "xlsx";
import { parseShotFile } from "../src/utils/excelParser";

const rows = [
  { 場次: "9", 鏡號: "02", 地點: "魚市場", 日夜: "早", 內外景: "內", 景別: "MS", 運鏡: "跟拍", 畫面內容: "主角穿過攤販。", 分鏡圖: "https://example.com/shot.jpg", 演員提示: "不要看鏡頭" },
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Shot List");
const xlsxBytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
const csvText = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows));

const makeFile = (name: string, bytes: ArrayBuffer | Uint8Array | string) => ({
  name,
  arrayBuffer: async () => typeof bytes === "string" ? new TextEncoder().encode(bytes).buffer : bytes instanceof ArrayBuffer ? bytes : bytes.buffer,
}) as File;

for (const file of [makeFile("shots.xlsx", xlsxBytes), makeFile("shots.csv", csvText)]) {
  const result = await parseShotFile(file);
  const shot = result.shots[0];
  if (!shot || shot.sceneNumber !== "9" || shot.shotNumber !== "02" || shot.storyboardImage !== "https://example.com/shot.jpg") throw new Error(`${file.name} mapping failed: ${JSON.stringify(shot)}`);
  console.log(`${file.name}: ${result.shots.length} shot, ${result.importMeta.mappedFields.length} fields mapped`);
}
