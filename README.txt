代碼入口頁
1. 直接雙擊 index.html 可預覽（需連網，載入 three.js 與 Google Fonts）；上線整個資料夾拖進 Netlify。
2. 修改發片時間：script.js 最上方 CONFIG.RELEASE_AT（倒數到 0000000 就停住，所有 0 都顯示）
3. 背景金屬環：預設是 WebGL 即時渲染的鉻金屬扭轉環；若放 assets/ring.png 則改用你的圖。
4. 若裝置不支援 WebGL，會自動退回 CSS 環。
