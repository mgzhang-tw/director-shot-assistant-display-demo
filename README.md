# Director Shot Assistant

給導演、攝影組與製片組在拍攝現場使用的 Web App MVP。控制頁匯入 Excel／CSV 後同步到 Supabase，Meta Ray-Ban Display 以專案代碼讀取同一份鏡頭資料。

本工具不會使用 Meta Ray-Ban Display 的攝影機、麥克風或錄音功能；也不模擬即時取景。

## 安裝與啟動

```bash
npm install
npm run dev
```

建置：`npm run build`。部署至 Vercel 時，匯入此資料夾並使用預設 Vite 設定即可。

## Supabase 測試同步

1. 建立 Supabase project。
2. 在 SQL Editor 執行 `supabase/setup.sql`。
3. 複製 `.env.example` 為 `.env.local`，填入 Project URL 與 publishable／anon key（不可放 service role key）。
4. 重啟 `npm run dev`。
5. 在 `/control` 匯入表格後按「同步到眼鏡」。
6. 眼鏡開啟 `/glasses?project=畫面上的代碼`。

尚未設定 Supabase 時，可用 `/glasses?project=DEMO` 測試 600×600 眼鏡畫面與方向鍵操作。正式讓眼鏡使用時，網站必須部署在公開 HTTPS 網址。

## 匯入 Excel／CSV

點選左上「選擇拍攝大表或 Shot List」，支援 `.xlsx`、`.xls`、`.csv`。第一個 sheet 會被讀取，每一列轉成一顆鏡頭。介面會列出 sheet 數量、資料列數、成功對應欄位與未辨識欄位。

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

目前只讀第一個 sheet，不解析 Excel 內嵌圖片，不支援登入、雲端同步、AI OCR 或多人協作。第二版可加入手動欄位 mapping、多 sheet 選擇、Google Sheets、手機控制頁、完整通告表解析與選配的 Meta Display 純文字 HUD；是否加入 Supabase／AI 應再依現場需要評估。
