## Why

目前地圖第一次打開時會停在預設區域，對不在預設區域的使用者來說很容易覺得地圖位置錯誤；即使曾經成功定位，重新整理後又回到預設區域也會打斷使用體驗。若能在首次進入時詢問是否要定位，並在之後直接從上次成功位置開始，同時減少同一區域的小幅拖曳重複打 API，就能讓地圖體驗更穩定也更貼近實際所在位置。

## What Changes

- 新增進入地圖時的 app 內定位提示，讓使用者選擇是否立即定位目前位置。
- 調整目前位置流程，讓首次定位可由開場提示觸發，而不只依賴後續手動按鈕。
- 新增使用者略過或關閉開場提示時的 fallback 行為，維持既有地圖瀏覽流程。
- 調整地圖初始瀏覽體驗，讓首次進入地圖時能清楚區分「尚未定位」與「已選擇暫不定位」。
- 記住最近一次成功定位的位置，讓使用者重新整理後可直接從上次位置開始，而不是再次看到開場定位詢問。
- 調整附近蘑菇資料的前端快取策略，讓已取得定位時的小幅地圖移動優先重用同一區域的資料，降低重複 API 請求。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `current-location`: 新增進入地圖時的定位提示流程，以及接受、略過提示、成功定位後重新整理的行為。
- `map-browsing`: 調整首次開啟地圖時的瀏覽體驗，支援從開場定位提示進入目前位置附近，並在相同定位區域內重用附近資料。

## Impact

- Affected specs:
  - `current-location`
  - `map-browsing`
- Affected code:
  - `src/components/mushroom-map-client.tsx`
- `src/lib/mushrooms/client-cache.ts`
  - `src/lib/mushrooms/map-ui.ts`
  - `src/app/globals.css`
  - 相關前端測試與互動文案
