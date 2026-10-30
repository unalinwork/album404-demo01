/* ================= 設定區 ================= */
const CONFIG = {
  // 發片時間（台北時間）。倒數秒數 = 這個時間 - 現在，歸零後停在 0000000
  RELEASE_AT: "2026-11-14T00:00:00+08:00",
  MIN_DIGITS: 7,                 // 最少位數：1296000 是 7 位，補滿所有 0
  GREETING: "你好",
  ERROR_CODE: "404",
  ERROR_TEXT: "not found"
};
/* ========================================== */

const $ = (id) => document.getElementById(id);
const enter = $("screen-enter"), result = $("screen-result");
const form = $("gate"), input = $("code");
const outCode = $("out-code"), countEl = $("count");
let timer = null, digits = [], last = "";

// 背景環：有 assets/ring.png 就用它
(function () {
  const ring = $("ring"), img = ring.querySelector("img");
  const ok = () => ring.classList.add("has-img");
  if (img.complete && img.naturalWidth) ok(); else img.addEventListener("load", ok);
})();

// 滑鼠 / 觸控光暈
window.addEventListener("pointermove", (e) => {
  document.body.style.setProperty("--mx", e.clientX + "px");
  document.body.style.setProperty("--my", e.clientY + "px");
});

$("hello").textContent = CONFIG.GREETING;
const err = document.querySelector(".err");
err.textContent = CONFIG.ERROR_CODE;
err.dataset.text = CONFIG.ERROR_CODE;
document.querySelector(".nf").textContent = CONFIG.ERROR_TEXT;

function secondsLeft() {
  const t = new Date(CONFIG.RELEASE_AT).getTime() - Date.now();
  return Math.max(0, Math.floor(t / 1000));
}

// 依位數建立方塊
function buildDigits() {
  const n = Math.max(CONFIG.MIN_DIGITS, String(secondsLeft()).length);
  countEl.innerHTML = "";
  digits = [];
  for (let i = 0; i < n; i++) {
    const d = document.createElement("span");
    d.className = "digit";
    d.textContent = "0";
    countEl.appendChild(d);
    digits.push(d);
  }
  last = "";
}

function tick() {
  const s = secondsLeft();
  const str = String(s).padStart(digits.length, "0");   // 補滿 0
  if (str !== last) {
    for (let i = 0; i < digits.length; i++) {
      if (str[i] !== last[i]) {
        digits[i].textContent = str[i];
        digits[i].classList.remove("tick");
        void digits[i].offsetWidth;
        digits[i].classList.add("tick");
      }
    }
    countEl.setAttribute("aria-label", String(s));
    last = str;
  }
  if (s <= 0) { countEl.classList.add("zero"); clearInterval(timer); }
}

// 代碼解碼動畫
function decode(el, text) {
  const pool = "01#<>/\\|_$%&*+=";
  const start = performance.now(), dur = 700;
  const run = setInterval(() => {
    const p = Math.min(1, (performance.now() - start) / dur);
    const keep = Math.floor(p * text.length);
    let s = text.slice(0, keep);
    for (let i = keep; i < text.length; i++) {
      s += text[i] === " " ? " " : pool[Math.floor(Math.random() * pool.length)];
    }
    el.textContent = s;
    if (p >= 1) { el.textContent = text; clearInterval(run); }
  }, 45);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const code = input.value.trim();
  if (!code) {
    input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
    input.focus();
    return;
  }
  enter.classList.remove("active");
  result.classList.add("active");
  decode(outCode, code);          // 粉絲自己編的代碼，例如 5100
  buildDigits();
  tick();
  clearInterval(timer);
  timer = setInterval(tick, 250);
});

input.focus();
