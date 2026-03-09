## Context

目前地圖體驗已經從單純顯示 fixture Mushroom，擴展成可結合瀏覽器定位、地圖互動與 Overpass 候選 POI 的混合流程。使用者在實際操作時，最主要的痛點不再只是「有沒有 marker」，而是「我目前在哪裡」、「哪些點是真的有人回報過」、「我如何快速回報目前看到的 Mushroom」。

這個 change 因此不只涵蓋定位與 marker 視覺化，也需要把 confirmed location、candidate POI 與 observation form 串成一致的地圖互動體驗。現有系統同時支援 fixture / Prisma location 與 Overpass candidate，且前端已使用自訂 DOM marker 與側欄列表，因此本次設計以維持單一路徑資料流為優先，避免再拆出平行 API 與重複狀態管理。

## Goals / Non-Goals

**Goals:**

- 提供明確的目前位置定位、回到目前位置與定位失敗 fallback。
- 讓 Mushroom marker 在地圖上可被快速辨識，並保留狀態與圖例說明。
- 讓使用者能區分已確認蘑菇與潛在候選點，並透過圖層開關控制可見性。
- 讓 observation 回報表單可從地圖互動快速預填，降低回報門檻。

**Non-Goals:**

- 不在此 change 中定義新的伺服器端預測演算法或事件蘑菇刷新規則。
- 不將 marker rendering 重寫為 MapLibre source/layer；目前維持 DOM marker。
- 不在此 change 中引入使用者帳號、多人協作權限或審核後台。

## Decisions

### Keep a unified map payload with sourceLayer metadata

地圖 API 繼續回傳單一 `mushrooms` 集合，但每筆資料附帶 `sourceLayer`，由前端根據 `confirmed` 或 `candidate` 決定 UI 呈現。這樣可以維持現有 `/api/mushrooms` 呼叫與排序流程，避免拆成兩個 API 或兩個獨立前端 state。

候選點與已確認點的去重放在 repository 層處理，因為這裡同時看得到 fixture / Prisma location 與 Overpass candidate。若已確認點與候選點外部鍵相同或距離非常接近，候選點會被濾掉，避免地圖與列表出現視覺上重複的目標。

替代方案是分別回傳 `confirmedLocations` 與 `candidateLocations`。這會讓前端更明確，但需要重做排序、選取、marker 同步與回報預填流程，對目前 MVP 來說增加太多協調成本。

### Distinguish confirmed and candidate points in the UI

已確認蘑菇與潛在候選點在 UI 上需要同時「看得出不同」與「保留相同互動模型」。因此保留同一套 marker 結構，但透過來源徽章、圖層標示、候選點虛線樣式與圖層切換控制來區分來源。

圖層控制採用「同一組 state 同時影響地圖 marker 與右側列表」的方式，避免畫面不同區塊顯示不一致。當使用者嘗試把最後一個可見圖層也關掉時，系統保留至少一層可見並顯示非阻斷提示，避免出現整張地圖與清單看似壞掉的空狀態。

替代方案是允許所有圖層都關閉。雖然自由度更高，但從實際操作回饋看起來很容易讓使用者誤判成資料載入失敗，因此本設計改採保護機制。

### Prefill observation reports from map interactions

回報流程的主要阻力在於填寫座標與對應目標不夠直覺。為此，選取既有蘑菇、點擊地圖空白位置與使用目前位置三種互動，都應能幫助 observation form 預填座標；其中選取蘑菇時應優先帶入該蘑菇的位置，而不是覆寫成使用者 GPS。

這個決策讓「更新既有蘑菇」與「回報新位置」都能留在同一個表單中，不需要再開啟額外 modal 或精簡版流程。對 MVP 而言，保留單一表單比建立多路徑互動更容易維護與測試。

### Reuse existing marker legend and state semantics

來源分層不取代既有狀態顏色語意。marker 顏色仍表示 active / defeated / unknown，來源差異則使用來源徽章、圖層標記與候選點樣式區分。這可以避免使用者同時學兩組顏色語意，也保留原本 spec 中對 marker 狀態顏色的一致性要求。

## Risks / Trade-offs

- [候選點與已確認點距離過近但其實是不同 POI] → 以保守距離閾值去重，並優先保留已確認資料；若未來誤殺案例增加，再引入更細的分類規則。
- [單一 payload 同時承載多種來源，前端條件判斷變多] → 以 `sourceLayer` 型別集中來源判斷，避免在元件中散落字串常數。
- [回報表單支援多種預填來源，可能讓欄位被覆寫] → 將快速帶入動作做成明確按鈕與可見摘要，降低隱性改值造成的困惑。
- [DOM marker 在資料量變大時效能有限] → 現階段維持 DOM marker，以換取較快的迭代速度；未來若地圖密度提升，再考慮改為真正的 MapLibre layer。

## Migration Plan

- 不需要資料庫 migration；`sourceLayer` 為應用層欄位，可由 repository 在回傳時補上。
- 既有 API 仍回傳 `mushrooms` 陣列，因此呼叫端不需要改 endpoint，只需接受新 metadata。
- 若需要回滾，可移除前端圖層控制與 `sourceLayer` 處理，API 仍可退回單純的 Mushroom location 集合。

## Open Questions

- 未來是否要把 confirmed / candidate 分成真正的 MapLibre source/layer，以支援更細緻的批次樣式與效能優化？
- 若後續導入更可靠的 Mushroom 刷新規則，是否要把 candidate 的預測資訊與 confirmed location 分開顯示？
