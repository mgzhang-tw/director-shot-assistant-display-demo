# Director Shot Assistant

給導演、攝影組與製片組在拍攝現場使用的 Web App MVP。控制頁匯入 Excel／CSV 後同步到 Supabase，Meta Ray-Ban Display 以專案代碼讀取同一份鏡頭資料。

本工具不會使用 Meta Ray-Ban Display 的攝影機、麥克風或錄音功能；也不模擬即時取景。

## 目前正式工作流程

未來新案子以「大表／分鏡圖 → 電腦檢查 → 眼鏡讀取」為標準流程。

- SOP：[docs/director-shot-assistant-sop.md](docs/director-shot-assistant-sop.md)
- 電腦檢查頁：`https://mgzhang-tw.github.io/director-shot-assistant-display-demo/?project=專案代碼`
- 眼鏡頁：`https://mgzhang-tw.github.io/director-shot-assistant-display-demo/?mode=glasses&project=專案代碼`
- 範例專案：`WANCAO24`

## 安裝與啟動

```bash
npm install
npm run dev
```

建置：`npm run build`。部署至 Vercel 時，匯入此資料夾並使用預設 Vite 設定即可。

## Supabase 測試同步

目前測試專案已接上 Supabase project `fyjvusodmuuecjcpsaly`，公開版使用 Supabase publishable key，不使用 service role key。

1. 建立 Supabase project。
2. 在 SQL Editor 執行 `supabase/setup.sql`。
3. 複製 `.env.example` 為 `.env.local`，填入 Project URL 與 publishable／anon key（不可放 service role key）。
4. 重啟 `npm run dev`。
5. 在 `/control` 匯入表格後按「同步到眼鏡」。
6. 眼鏡開啟 `/glasses?project=畫面上的代碼`。

尚未設定 Supabase 時，可用 `?mode=glasses&project=DEMO` 測試 600×600 眼鏡畫面與方向鍵操作。正式讓眼鏡使用時，網站必須部署在公開 HTTPS 網址。

### 眼鏡操作

- 左／右：切換「分鏡、鏡頭、提示」資訊頁。
- 上／下：切換上一鏡／下一鏡。
- Neural Band Select／Enter 或網頁雙擊：開啟拍攝狀態選單。
- 狀態選單內用上下選擇，Select／Enter 或雙擊確認。
- 測試版狀態保存在眼鏡瀏覽器的 localStorage；啟用 Supabase 後才能跨裝置同步。

## 匯入 Excel／CSV

點選左上「選擇拍攝大表或 Shot List」，支援 `.xlsx`、`.xls`、`.csv`。系統會嘗試尋找真正的拍攝計劃 sheet、偵測表頭列，並排除 DAY、轉場、休息、餐食與空白列。介面會列出 sheet 數量、資料列數、成功對應欄位與未辨識欄位。

支援中英文常見欄名，例如：場次／Scene、鏡號／Shot、地點／Location、日夜／Time、內外景／INT/EXT、景別／Shot Size、運鏡／Camera Movement、畫面內容／Description、分鏡圖／Storyboard、台詞、演員提示、視覺提示、道具、角色、備註與預估時間。

## 分鏡圖

- `https://` 或 `http://` 圖片網址：直接顯示。
- 專案內 `/...` 圖片：直接顯示。
- 本機檔名：顯示檔名提示，不嘗試讀取電腦檔案。
- 空白：顯示 `No Storyboard Image`。

Excel 內嵌圖片不在 MVP 範圍。

## 操作

- 方向鍵：上一顆／下一顆鏡頭
- `D`：完成，`R`：重拍，`S`：拍攝中，`K`：跳過
- 控制頁狀態會先儲存在 localStorage，按「同步到眼鏡」後寫入 Supabase。

## 第一版限制與後續

目前不解析 Excel 內嵌圖片，不支援登入、AI OCR 或多人協作。第二版可加入手動欄位 mapping、Google Sheets、手機控制頁、即時同步與 GlassKit 版本的眼鏡 UI；是否加入更完整的雲端後台，應再依現場需要評估。
