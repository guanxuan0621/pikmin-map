## Context

這個 change 要建立一個以社群觀測資料為基礎的 Pikmin Mushroom Web Application。系統需要同時支援三種不同性質的資訊：

1. 使用者提交的原始觀測資料
2. 系統根據多筆觀測整併後得到的目前狀態
3. 系統根據歷史資料與目前狀態計算出的未來預測

這三者的可信度、更新頻率與用途都不同，如果混在同一層資料模型中，會讓前端顯示、資料整併、推估邏輯與後續迭代都變得難以維護。

此外，本產品在 MVP 階段的最大限制不是地圖技術，而是資料量不足與資料品質不穩定。設計上必須優先支援：

- 快速建立可回報、可查詢、可驗證的資料流
- 明確區分 observed state 與 predicted state
- 允許未來加入更完整的信任模型與更進階的預測方法

主要利害關係人包括：

- 終端使用者：希望快速看到附近 Mushroom、最新狀態與預測資訊
- 系統維護者：希望可觀察資料品質、調整規則並持續改進預測

## Goals / Non-Goals

**Goals:**

- 建立一條從使用者回報到地圖查詢的完整資料流
- 讓前端能查詢 Mushroom 地點、目前推導狀態、最後更新時間與預測結果
- 將原始觀測、推導狀態與預測結果分離建模
- 讓資料整併、預測刷新與清理工作由背景流程處理，而不是阻塞使用者請求
- 在 MVP 中提供可用但保守的預測能力，避免在資料不足時偽造結果
- 納入最基本的資料品質保護措施，例如驗證、速率限制與衝突標記

**Non-Goals:**

- 在 MVP 階段建立高精度機器學習模型
- 從遊戲客戶端自動擷取或爬取資料
- 保證所有 Mushroom 狀態都具備即時性或高可信度
- 在第一版中完成完整的帳號信譽系統或人工審核後台

## Decisions

### Separate raw observations, derived mushroom state, and predictions

系統將資料拆成三個主要層級：

- `observation`: 使用者提交的原始回報
- `derived mushroom state`: 系統根據多筆 observation 推導出的目前狀態
- `prediction`: 系統推估出的完成時間與下一次出現時間

這樣做的原因是三種資料具有不同的生命週期與用途：

- 原始 observation 必須保留，才能支援追溯、衝突處理與未來重新計算
- derived state 是地圖查詢的主資料來源，目標是快速讀取與穩定顯示
- prediction 是可被重新計算的附加結果，不能與 observed state 混為一談

替代方案是只存一張「目前 Mushroom 狀態」表，把使用者回報與預測都直接覆寫進去。這樣初期比較快，但會失去追溯能力，也會讓資料衝突與信心判斷幾乎無法處理，因此不採用。

### Use map query APIs for reads and a dedicated observation ingestion path for writes

系統將讀寫流分開：

- 讀取路徑：前端透過 map query API 依目前地圖視窗或附近範圍查詢 Mushroom 資訊
- 寫入路徑：使用者透過 observation ingestion API 提交 observation

這個決策的理由是讀與寫的需求不同：

- 讀取需要低延遲、可快取、回傳已整併資料
- 寫入需要驗證、速率限制、記錄原始資料、觸發後續整併

如果把讀寫都建立在同一個同步流程上，使用者提交 observation 時就必須等待衝突處理與預測重算完成，請求延遲會提高，也更難擴展。因此設計上讓提交 observation 先成功寫入，再由背景流程負責整併與更新衍生資料。

替代方案是每次提交 observation 後同步更新 derived state 與 prediction。這樣雖然實作直觀，但會把驗證、整併與推估耦合在同一條 request path 中，增加失敗面與效能風險，因此不採用。

### Use background jobs for aggregation and prediction refresh

系統會將以下工作放進背景任務：

- observation 去重與衝突整併
- derived mushroom state 重建或刷新
- prediction 重算
- 過期資料標記與清理

這個決策有三個主要原因：

- 觀測整併與預測計算屬於可延後的衍生流程，不需要阻塞使用者提交
- map query 應該讀取已整理好的結果，而不是每次臨時計算
- 後續若加入更多規則、統計方法或批次重算，背景處理更容易擴充

替代方案是查詢時即時計算目前狀態與預測。這會讓查詢成本直接受 observation 數量影響，也不利於快取，因此不採用。

### Use rule-based prediction heuristics for MVP

MVP 的 prediction engine 將採用 rule-based heuristics，而不是機器學習模型。預測輸出包含：

- predicted completion time
- predicted next spawn time
- confidence
- unavailable 狀態

這個決策的理由是：

- 目前沒有足夠歷史資料支撐可靠的模型訓練
- rule-based 方法更容易解釋、修正與對照實際結果
- 規則式系統能更自然處理「資料不足就不預測」的保守策略

這份設計預期未來可把 prediction implementation 替換為更進階的方法，但對外 spec 保持不變，仍然要求系統區分 prediction 與 direct observation，並在資料不足時回傳 unavailable。

替代方案是一開始就引入 Python-based ML pipeline。雖然長期可能有價值，但在目前資料量、複雜度與產品階段下成本過高，因此不採用。

### Use geospatial storage and area-based map queries

系統會把 Mushroom location 視為具地理座標的核心實體，查詢以地圖可見區域或附近範圍為中心。這代表資料儲存層需要支援：

- location indexing
- bounding box 或 nearby query
- location identity 的穩定管理

這個決策的原因是產品的主要互動模式是看地圖，而不是用純列表瀏覽。資料模型若沒有把 location 當成一級概念，後續在附近查詢、位置聚合與 marker 更新上都會變得脆弱。

替代方案是只用一般關聯式欄位存字串位置描述，再由應用層自行比對。這樣會讓位置去重與附近查詢變得困難，因此不採用。

### Validate and rate limit observations before they enter aggregation

所有 observation 在進入 aggregation 之前都必須先通過：

- 請求格式驗證
- 必填欄位驗證
- 時間欄位驗證
- submission rate limiting
- 基本 suspicious pattern checks

這個決策的原因是 aggregation 與 prediction 對輸入品質敏感。如果把髒資料直接寫入核心流程，後面每個步驟都會變得更複雜。前置驗證不能完全阻止錯誤資料，但可以先濾掉最明顯的問題，降低後續衝突處理成本。

替代方案是先接受所有資料，完全交給後處理判斷。這樣雖然彈性較高，但會增加資料污染與濫用風險，因此不採用。

## Risks / Trade-offs

- [低資料量導致 prediction 常為 unavailable] → 在 UI 上清楚區分 unavailable 與 predicted，並優先優化 observation collection flow
- [使用者回報互相衝突，造成 derived state 不穩定] → 保留 raw observations、標記衝突狀態，並讓 aggregation 採用保守規則
- [位置識別不一致，導致同一 Mushroom 被建立成多個 location] → 為 location 定義穩定識別策略，並在 ingestion 流程中加入位置比對與合併規則
- [同步路徑過重，導致提交或查詢變慢] → 將整併與預測計算移到背景任務，讓查詢優先讀取衍生結果
- [MVP 的 trust model 過於簡單，仍可能讓部分異常資料進入系統] → 第一版先處理驗證、速率限制與基本 flagging，後續再增加 reputation 與 moderation 能力
- [規則式 prediction 不夠準確] → 將 confidence 與 unavailable 作為正式輸出的一部分，避免對使用者暗示虛假的精準度

## Migration Plan

這是一個新系統的初始 change，沒有既有產品行為需要相容性遷移，但仍建議以分階段方式落地：

1. 建立 location、observation、derived state、prediction 的資料模型
2. 建立 observation ingestion API 與 map query API
3. 先完成地圖讀取已知資料與 observation submission flow
4. 接上 background jobs，開始產生 derived state
5. 加入 MVP 的 prediction refresh 流程
6. 補上 rate limiting、衝突標記與基本監控

若某一階段需要回退，應優先停用衍生流程或 prediction 輸出，而保留 observation 收集與地圖基本瀏覽能力，避免整個產品完全不可用。

## Open Questions

- Mushroom location 的穩定識別方式要以座標為主、格網為主，還是需要額外的人工對照策略
- observation submission 的 MVP 是否允許匿名提交，或需要最基本的登入機制
- predicted completion time 與 predicted next spawn time 的 confidence 要用離散等級還是數值分數表示
- 地圖 UI 在 stale data、conflicting data、prediction unavailable 三種狀態下要如何清楚區分
- 是否需要在 MVP 就加入使用者個人回報歷史，作為後續 reputation 的基礎
