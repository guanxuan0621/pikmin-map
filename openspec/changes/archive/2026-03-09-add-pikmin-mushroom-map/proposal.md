## Why

目前 Pikmin Bloom 沒有提供公開的 Mushroom 出現規律或可直接查詢的官方資料來源，玩家難以掌握附近有哪些蘑菇、何時會被打完，以及新的蘑菇可能何時出現。建立一個以社群觀測為基礎的 Web Application，可以先集中蒐集使用者回報，再將原始觀測資料整併為共享地圖資訊，並逐步發展出可用的完成時間與重生時間推估能力。

## What Changes

- 新增一個 Web 地圖介面，讓使用者查詢目前附近的 Mushroom 與其狀態。
- 新增使用者回報機制，讓玩家可以提交 Mushroom 的觀測資料，例如位置、狀態、時間與其他必要欄位。
- 新增伺服器端資料整併流程，將多筆原始觀測整理為每個 Mushroom 地點的推導狀態。
- 新增預測能力，提供 Mushroom 可能的打完時間與下一次出現時間，並明確區分觀測值與推估值。
- 新增基礎資料品質保護措施，例如輸入驗證、速率限制與衝突資料處理規則。
- 為後續的信任模型、資料品質分析與更進階的預測演算法建立可擴充的基礎。

## Capabilities

### New Capabilities

- `map-browsing`: 讓使用者在互動式地圖上查看附近 Mushroom 的位置、目前推導狀態、最後更新時間與預測資訊。
- `observation-reporting`: 讓使用者提交 Mushroom 的觀測資料，並定義回報欄位、驗證規則與錯誤處理行為。
- `prediction-engine`: 根據歷史觀測與目前狀態，產生 Mushroom 的可能完成時間與下一次出現時間，並附帶信心資訊。
- `trust-and-moderation`: 定義基礎的資料品質保護機制，包括速率限制、可疑資料處理與觀測衝突管理。

### Modified Capabilities

- （無）

## Impact

- Affected specs:
  - `map-browsing`
  - `observation-reporting`
  - `prediction-engine`
  - `trust-and-moderation`
- Affected code:
  - 前端地圖瀏覽與回報介面
  - 後端查詢 API 與觀測資料接收 API
  - 資料庫 schema，包括 Mushroom 地點、觀測資料、推導狀態與預測結果
  - 背景工作流程，用於資料整併、狀態更新與預測刷新
  - 快取、速率限制與基本監控機制
