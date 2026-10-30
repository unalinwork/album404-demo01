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
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let timer = null, digits = [], last = "";
const mouse = { x: 0, y: 0 };

/* ---------- 滑鼠 / 觸控光暈與視差 ---------- */
window.addEventListener("pointermove", (e) => {
  document.body.style.setProperty("--mx", e.clientX + "px");
  document.body.style.setProperty("--my", e.clientY + "px");
  mouse.x = e.clientX / innerWidth - 0.5;
  mouse.y = e.clientY / innerHeight - 0.5;
});

/* ---------- 背景：自己的環圖 or WebGL 金屬扭轉環 ---------- */
const bg = document.querySelector(".bg");
(function () {
  const ring = $("ring"), img = ring.querySelector("img");
  const ok = () => { ring.classList.add("has-img"); bg.classList.add("has-img"); };
  if (img.complete && img.naturalWidth) ok(); else img.addEventListener("load", ok);
})();

function initGL() {
  if (!window.THREE) return;
  const canvas = $("gl");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
  catch (e) { return; }
  bg.classList.add("gl-on");
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0, 6);

  // 用畫布畫一張「攝影棚燈光」環境圖，讓金屬有反光
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#dfe8fa"); grad.addColorStop(.48, "#12151c"); grad.addColorStop(1, "#000");
  g.fillStyle = grad; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "#fff";
  [[60, 110, 170, 70], [390, 50, 230, 40], [690, 140, 120, 120], [900, 40, 90, 60], [250, 300, 300, 18]]
    .forEach((r) => g.fillRect(r[0], r[1], r[2], r[3]));
  g.fillStyle = "#8fc7ff"; g.fillRect(250, 190, 60, 150);
  g.fillStyle = "#ffb3e6"; g.fillRect(600, 210, 50, 110);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromEquirectangular(tex).texture;
  scene.environment = env;

  // 扭轉一圈的帶狀環
  const R = 1.55, W = 0.62, SEG = 260, WS = 28, pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) {
    const u = (i / SEG) * Math.PI * 2;
    for (let j = 0; j <= WS; j++) {
      const v = (j / WS - 0.5) * 2 * W;
      pos.push(
        (R + v * Math.cos(u)) * Math.cos(u),
        (R + v * Math.cos(u)) * Math.sin(u),
        v * Math.sin(u) * 1.0
      );
    }
  }
  for (let i = 0; i < SEG; i++) for (let j = 0; j < WS; j++) {
    const a = i * (WS + 1) + j, b = a + WS + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 1, roughness: 0.07, envMap: env,
    envMapIntensity: 1.5, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = 2 * 6 * Math.tan((40 * Math.PI) / 360), vw = vh * camera.aspect;
    if (camera.aspect > 1) { mesh.userData.base = [-vw * 0.27, 0]; mesh.scale.setScalar(1.05); }
    else { mesh.userData.base = [-vw * 0.08, vh * 0.27]; mesh.scale.setScalar(Math.min(1, vw / 3.8)); }
  }
  addEventListener("resize", resize); resize();

  let tx = 0, ty = 0, t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    tx += (mouse.y * 0.8 - tx) * 0.05;
    ty += (mouse.x * 0.8 - ty) * 0.05;
    mesh.rotation.set(0.9 + tx + Math.sin(t * 0.4) * 0.12, ty + t * 0.18, t * 0.22);
    mesh.position.set(
      mesh.userData.base[0] + Math.sin(t * 0.6) * 0.08,
      mesh.userData.base[1] + Math.cos(t * 0.5) * 0.1, 0);
    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
initGL();

/* ---------- 文案 ---------- */
$("hello").textContent = CONFIG.GREETING;
const err = document.querySelector(".err");
err.textContent = CONFIG.ERROR_CODE;
err.dataset.text = CONFIG.ERROR_CODE;
document.querySelector(".nf").textContent = CONFIG.ERROR_TEXT;

/* ---------- 倒數（滾動數字，補滿 0） ---------- */
function secondsLeft() {
  const t = new Date(CONFIG.RELEASE_AT).getTime() - Date.now();
  return Math.max(0, Math.floor(t / 1000));
}

function buildDigits() {
  const n = Math.max(CONFIG.MIN_DIGITS, String(secondsLeft()).length);
  countEl.innerHTML = "";
  digits = [];
  for (let i = 0; i < n; i++) {
    const d = document.createElement("span");
    d.className = "digit";
    const roll = document.createElement("div");
    roll.className = "roll";
    for (let k = 0; k < 10; k++) { const b = document.createElement("b"); b.textContent = k; roll.appendChild(b); }
    d.appendChild(roll); countEl.appendChild(d);
    digits.push({ el: d, roll, v: -1 });
  }
  last = "";
}

function setDigit(o, v, animate) {
  if (o.v === v) return;
  o.v = v;
  o.roll.style.transform = `translateY(${-v * 10}%)`;
  if (animate) {
    o.el.classList.add("moving");
    clearTimeout(o.t);
    o.t = setTimeout(() => o.el.classList.remove("moving"), 450);
  }
}

function tick(first) {
  const s = secondsLeft();
  const str = String(s).padStart(digits.length, "0");   // 補滿 0
  if (str === last) return;
  for (let i = 0; i < digits.length; i++) setDigit(digits[i], +str[i], !first);
  if (first) requestAnimationFrame(() => digits.forEach((o) => o.roll.classList.add("go")));
  else if (!reduced) { countEl.classList.remove("pulse"); void countEl.offsetWidth; countEl.classList.add("pulse"); }
  countEl.setAttribute("aria-label", String(s));
  last = str;
  if (s <= 0) { countEl.classList.add("zero"); clearInterval(timer); }
}

/* ---------- 代碼解碼動畫 ---------- */
function decode(el, text) {
  const pool = "01#<>/\\|_$%&*+=";
  const start = performance.now(), dur = 800;
  const run = setInterval(() => {
    const p = Math.min(1, (performance.now() - start) / dur);
    const keep = Math.floor(p * text.length);
    let s = text.slice(0, keep);
    for (let i = keep; i < text.length; i++) s += text[i] === " " ? " " : pool[Math.floor(Math.random() * pool.length)];
    el.textContent = s;
    if (p >= 1) { el.textContent = text; clearInterval(run); }
  }, 45);
}

/* ---------- 換頁：百葉窗閃白 ---------- */
const wipeEl = $("wipe");
for (let i = 0; i < 9; i++) { const b = document.createElement("i"); b.style.setProperty("--i", i); wipeEl.appendChild(b); }
function wipe(mid) {
  if (reduced) { mid(); return; }
  wipeEl.className = "wipe in";
  setTimeout(() => {
    mid();
    wipeEl.className = "wipe out";
    setTimeout(() => (wipeEl.className = "wipe"), 650);
  }, 600);
}

/* ---------- 送出 ---------- */
let busy = false;
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (busy) return;
  const code = input.value.trim();
  if (!code) {
    input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
    input.focus();
    return;
  }
  busy = true;
  wipe(() => {
    enter.classList.remove("active");
    result.classList.add("active");
    decode(outCode, code);          // 粉絲自己編的代碼，例如 5100
    buildDigits();
    tick(true);
    clearInterval(timer);
    timer = setInterval(() => tick(false), 250);
  });
});

input.focus();
