import { FileCsv, FileXls, Trash } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import type { ImportMeta, Shot } from "../types";
import { parseShotFile } from "../utils/excelParser";

export function ImportPanel({ meta, total, done, onImport, onSample }: { meta: ImportMeta | null; total: number; done: number; onImport: (shots: Shot[], meta: ImportMeta) => void; onSample: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const choose = async (file?: File) => {
    if (!file) return;
    try { setError(""); const result = await parseShotFile(file); onImport(result.shots, result.importMeta); }
    catch (err) { setError(err instanceof Error ? err.message : "無法解析檔案"); }
  };
  return <section className="panel import-panel">
    <div className="panel-heading"><h2>匯入檔案</h2><span>Excel / CSV</span></div>
    <input ref={input} type="file" accept=".xlsx,.xls,.csv" onChange={(event) => choose(event.target.files?.[0])} hidden />
    <button className="file-drop" onClick={() => input.current?.click()}>
      {meta?.fileName.endsWith(".csv") ? <FileCsv size={25} /> : <FileXls size={25} />}
      <span><strong>{meta?.fileName || "選擇拍攝大表或 Shot List"}</strong><small>{meta ? `工作表：${meta.sheetName}｜共 ${meta.sheetCount} 個 sheet` : "支援 .xlsx、.xls、.csv"}</small></span>
      <b>{meta ? "匯入成功" : "瀏覽檔案"}</b>
    </button>
    <div className="import-stats">
      <div><small>總計</small><strong>{total} 鏡</strong></div><div><small>完成</small><strong className="green">{done} 鏡</strong></div><div><small>辨識欄位</small><strong>{meta?.mappedFields.length ?? "—"}</strong></div>
    </div>
    {meta && <div className="mapping-note"><span>未辨識：{meta.unmappedColumns.join("、") || "無"}</span><span>{new Date(meta.importedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</span></div>}
    {error && <p className="error">{error}</p>}
    <button className="text-button" onClick={onSample}><Trash size={16} /> 載入示範資料</button>
  </section>;
}
