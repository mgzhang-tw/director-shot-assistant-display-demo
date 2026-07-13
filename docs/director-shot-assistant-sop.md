# Director Shot Assistant SOP

這份文件是 Director Shot Assistant 的正式工作流程備份。目標是讓未來每次拍攝前，只要提供「拍攝大表」與「分鏡圖／通告手冊」，就能快速整理成電腦可檢查、眼鏡可讀取的專案網址。

## 產品定位

Director Shot Assistant 是給導演在拍攝現場使用的 Meta Ray-Ban Display 輔助網頁。

它負責顯示：

- 目前鏡號、場次、拍攝狀態
- 分鏡圖或參考圖
- 角色、台詞、導演提示、視覺提示
- 拍攝狀態：準備中、拍攝中、完成、重拍、跳過等

它不負責：

- 呼叫眼鏡攝影機
- 呼叫眼鏡麥克風或錄音
- 模擬實拍預覽畫面
- 自動取代導演判斷

## 固定使用原則

1. 先做電腦版檢查，不一開始就叫導演戴眼鏡測試。
2. 電腦版確認鏡號、順序、文字與分鏡圖都正確後，再給眼鏡網址。
3. 大表格式每個案子可能不同，所以匯入時要先理解內容，不硬套單一欄位格式。
4. 分鏡圖通常不在大表裡；大表歸大表，分鏡圖／通告手冊歸分鏡圖。
5. 鏡號是主要配對依據。分鏡圖、通告表、拍攝大表都應優先用鏡號對齊。
6. 目前同步不是即時推播。電腦同步後，眼鏡端重新整理或重新開啟網址讀取最新資料。

## 現有正式網址

- 電腦檢查頁：`https://mgzhang-tw.github.io/director-shot-assistant-display-demo/?project=專案代碼`
- 眼鏡頁：`https://mgzhang-tw.github.io/director-shot-assistant-display-demo/?mode=glasses&project=專案代碼`
- GitHub Repo：`https://github.com/mgzhang-tw/director-shot-assistant-display-demo`

範例專案：

- `WANCAO24`
- 電腦檢查：`https://mgzhang-tw.github.io/director-shot-assistant-display-demo/?project=WANCAO24`
- 眼鏡讀取：`https://mgzhang-tw.github.io/director-shot-assistant-display-demo/?mode=glasses&project=WANCAO24`

## 每次新案子的輸入資料

理想提供：

1. 拍攝大表：`.xlsx`、`.xls`、`.csv`
2. 分鏡圖來源：PDF 通告手冊、分鏡圖 PDF、圖片資料夾或 ZIP
3. 專案代碼：例如 `WANCAO24`、`SOFA01`
4. 若有特殊規則，另外說明：
   - 哪些 sheet 才是正式拍攝表
   - 哪些 row 是轉場、休息、吃飯，不是鏡頭
   - 分鏡圖是否有重複鏡號
   - 是否要保留補拍、正片、重拍等特殊狀態

## 大表處理 SOP

1. 檢查 workbook 裡有哪些 sheet。
2. 優先找真正的拍攝計劃／拍攝大表 sheet，不盲目讀第一個 sheet。
3. 判斷表頭位置。很多大表前面會有標題、日期、說明列，不能直接把第一列當欄位。
4. 排除非鏡頭列：
   - DAY 標題
   - 轉場
   - 休息
   - 午餐／晚餐
   - 空白列
5. 正規化鏡號：
   - `01`、`1`、`1-1`、`D1-05` 都要整理成可穩定比對的鏡號。
   - 若 Excel 把鏡號誤判成日期，要轉回鏡號格式。
6. 對應欄位：
   - 場次／Scene
   - 鏡號／Shot
   - 地點／Location
   - 內外景／INT/EXT
   - 日夜／Time
   - 景別／Shot Size
   - 運鏡／Camera Movement
   - 畫面內容／Description
   - 台詞／Dialogue
   - 演員提示／Actor Note
   - 視覺提示／Visual Note
   - 道具／Props
   - 備註／Notes
7. 產出拍攝順序清單，並保留原始順序。

## 分鏡圖處理 SOP

1. 如果是 PDF，先轉成每頁圖片或抽出頁面中的分鏡圖。
2. 依 PDF 上的鏡號辨識圖片對應關係。
3. 將圖片輸出成適合網頁使用的格式，優先使用 `.webp`。
4. 放到 `public/storyboards/專案代碼/`。
5. 命名要穩定，例如：
   - `shot-01.webp`
   - `shot-02.webp`
   - `shot-18.webp`
6. 若同一鏡號出現多次，要確認是重複使用同一張圖，還是不同版本。
7. 若大表有鏡號但分鏡圖沒有，要在檢查時列出缺圖清單。
8. 若分鏡圖有鏡號但大表沒有，要列成未使用分鏡圖，不要直接丟掉。

## 專案寫入 SOP

1. 產生乾淨的 project payload。
2. 每個 shot 至少要有：
   - `scene`
   - `shot`
   - `title`
   - `description`
   - `storyboardUrl`
   - `status`
3. 上傳或提交分鏡圖資產。
4. 透過 Supabase 儲存專案資料。
5. 開啟電腦檢查頁確認資料。
6. 確認無誤後，提供眼鏡網址。

## Supabase 同步設定

目前 Supabase 用來儲存眼鏡可讀取的專案資料。

已知設定：

- Project ref：`fyjvusodmuuecjcpsaly`
- Project URL：`https://fyjvusodmuuecjcpsaly.supabase.co`
- SQL schema：`supabase/setup.sql`

安全原則：

- 前端只能放 publishable／anon key。
- 不可以把 service role key 放進 GitHub。
- `.env.local` 不進 GitHub。
- 若要重新部署或換 Supabase project，先更新 `.env.example` 的格式，再在本機放實際 `.env.local`。

Supabase 免費方案可能會休眠。若眼鏡或電腦頁出現同步失敗：

1. 先打開 Supabase dashboard。
2. 等待 project 醒來。
3. 重新整理電腦頁。
4. 再重新開眼鏡網址。

## 驗收清單

每次交付新專案前，至少檢查：

- 電腦檢查頁能開。
- 專案代碼正確。
- 鏡頭數量正確。
- 第一鏡、最後一鏡正確。
- 上下切換鏡頭順序正確。
- 左右切換資訊頁正確。
- 分鏡圖載入速度可接受。
- 缺圖、重複鏡號、未使用分鏡圖都有被說明。
- 眼鏡網址能讀到同一份資料。
- 電腦同步後，眼鏡重新整理能看到更新。

## GitHub 備份與部署 SOP

每次修改後：

1. 確認工作樹只有本次要提交的內容。
2. 若改程式碼，執行：
   - `npm run typecheck`
   - `npm run build`
3. 提交到 `main`。
4. 推送到 GitHub。
5. 確認 GitHub Actions 部署成功。
6. 開正式網址檢查。

目前 GitHub Pages 由 `.github/workflows/deploy.yml` 部署。

## GlassKit 判斷

GlassKit 適合未來拿來整理眼鏡端 UI 與控制邏輯，例如 600×600 lens、D-pad focus、Neural Band 操作與系統返回手勢。

但 GlassKit 不會解決：

- Excel 大表解析
- PDF 分鏡圖抽取
- 鏡號配對
- Supabase 同步
- GitHub Pages 部署

所以目前策略是：

1. 先固定這份 SOP，讓每次專案都能順利轉成眼鏡可讀版本。
2. 累積 2 到 3 個真實案子的資料格式。
3. 確定眼鏡端操作邏輯穩定後，再把 glasses UI 重構成 GlassKit 版本。

## 未來標準工作方式

未來新案子建議直接照這樣進行：

1. MG 提供大表與分鏡圖／通告手冊。
2. Codex 讀取資料，判斷格式。
3. Codex 產生專案資料與分鏡圖資產。
4. Codex 先給電腦檢查網址。
5. MG 在電腦確認鏡頭內容。
6. Codex 修正缺圖、錯位、文字欄位。
7. 確認後提供眼鏡網址。
8. GitHub 備份本次資料與 SOP 更新。

這套流程的核心不是「讓導演自己填表」，而是把每次不規則的大表整理成現場真正能看的眼鏡版本。
