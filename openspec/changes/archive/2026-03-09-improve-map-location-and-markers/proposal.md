## Why

目前地圖雖然已能顯示 Mushroom 資訊，但使用者仍無法快速知道自己目前所在位置，也無法直覺辨識哪些點位是已被玩家確認的 Mushroom、哪些只是可能生成 Mushroom 的候選 POI。這使得「查找附近蘑菇」與「回報最新狀態」的核心體驗仍不夠完整，因此需要補上目前位置感知、更清楚的地圖 marker 視覺化，以及來源分層與回報輔助流程。

## What Changes

- 新增目前位置定位能力，讓使用者可主動要求顯示自己的位置。
- 新增「回到我的位置」或等效的定位互動流程，讓地圖可聚焦到使用者附近。
- 新增定位成功、定位失敗與權限拒絕時的回饋顯示與 fallback 行為。
- 新增 Mushroom 彩色 icon marker，提升地圖上的可辨識性。
- 新增 marker 顏色語意與基本 legend，讓使用者能快速理解不同狀態。
- 新增已確認蘑菇與潛在候選點的來源分層，讓地圖與列表可清楚區分兩種來源。
- 新增圖層顯示控制，讓使用者可切換已確認蘑菇與潛在候選點的可見性，並避免所有圖層同時被關閉。
- 改善 observation 回報流程，讓使用者可從地圖選取的蘑菇、點擊地圖座標或目前位置快速帶入回報表單。
- 調整既有 map browsing 行為，讓地圖能配合使用者位置與新的 marker 呈現方式。

## Capabilities

### New Capabilities

- `current-location`: 讓使用者主動要求定位目前位置，顯示自身位置，並將地圖聚焦到附近區域。
- `mushroom-marker-visualization`: 以彩色 icon marker 呈現 Mushroom，並提供清楚的狀態語意與基本圖例。
- `mushroom-source-layering`: 區分已確認蘑菇與潛在候選點，並提供圖層開關與一致的來源標示。

### Modified Capabilities

- `map-browsing`: 更新地圖瀏覽需求，使其支援以使用者目前位置為中心的操作流程，並配合新的 Mushroom marker 呈現方式。
- `observation-reporting`: 更新回報流程需求，使地圖選取、點擊地圖與目前位置可協助預填 observation 表單。

## Impact

- Affected specs:
  - `current-location`
  - `mushroom-marker-visualization`
  - `mushroom-source-layering`
  - `map-browsing`
  - `observation-reporting`
- Affected code:
  - 前端地圖元件與 marker rendering
  - 使用者定位權限與位置狀態管理
  - 地圖控制元件，例如定位按鈕與回到目前位置按鈕
  - 地圖資料來源整合與 confirmed/candidate 去重邏輯
  - 圖層切換控制、來源標示與可見性保護
  - observation 回報表單的快速帶入與提示介面
  - 地圖 legend / marker 視覺樣式
  - 目前位置與 map query 的互動流程
