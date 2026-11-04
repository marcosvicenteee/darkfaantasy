/* =========================================================
   Wallpaper Text Generator
   - Exporta MP4 real (H.264) compatible con CapCut / TikTok
   - Tipografía y tamaño independientes por cada texto
   - Color automático que combina con la foto o el vídeo
   ========================================================= */

const $ = id => document.getElementById(id);
const background = $("background");
const stage = $("stage");
const mainText = $("mainText");

let mediaURL = null;
let resultURL = null;

/* =========================
   TIPOGRAFÍAS
   ========================= */

const FONTS = [
  { label: "Luckiest Guy",     family: "Luckiest Guy",    weight: 400 },
  { label: "Bangers",          family: "Bangers",         weight: 400 },
  { label: "Lilita One",       family: "Lilita One",      weight: 400 },
  { label: "Anton",            family: "Anton",           weight: 400 },
  { label: "Bebas Neue",       family: "Bebas Neue",      weight: 400 },
  { label: "Archivo Black",    family: "Archivo Black",   weight: 400 },
  { label: "Titan One",        family: "Titan One",       weight: 400 },
  { label: "Oswald",           family: "Oswald",          weight: 700 },
  { label: "Permanent Marker", family: "Permanent Marker", weight: 400 },
  { label: "Righteous",        family: "Righteous",       weight: 400 }
];

const TEXTS = [
  { key: "top",    el: "topText",    input: "topInput",    base: "9.72cqw",  canvas: 105, y: 170, white: true,  font: "Luckiest Guy" },
  { key: "main",   el: "mainText",   input: "mainInput",   base: "19.44cqw", canvas: 210, y: 400, white: false, font: "Bangers" },
  { key: "mid",    el: "midText",    input: "midInput",    base: "8.8cqw",   canvas: 95,  y: 690, white: true,  font: "Luckiest Guy" },
  { key: "bottom", el: "bottomText", input: "bottomInput", base: "10.19cqw", canvas: 110, y: 890, white: false, font: "Bangers" }
];

const fontOf = {};
const sizeOf = {};

TEXTS.forEach(t => {
  fontOf[t.key] = FONTS.find(f => f.family === t.font) || FONTS[0];
  sizeOf[t.key] = 100;
});

function fontCss(f) {
  return `"${f.family}", Impact, sans-serif`;
}

function applyTypography() {
  TEXTS.forEach(t => {
    const el = $(t.el);
    const f = fontOf[t.key];
    el.style.fontFamily = fontCss(f);
    el.style.fontWeight = String(f.weight);
    el.style.fontSize = `calc(${t.base} * ${sizeOf[t.key] / 100})`;
  });
}

function buildTypoControls() {
  TEXTS.forEach(t => {
    const sel = $("font-" + t.key);
    FONTS.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.family;
      opt.textContent = f.label;
      sel.appendChild(opt);
    });
    sel.value = fontOf[t.key].family;
    sel.addEventListener("change", () => {
      fontOf[t.key] = FONTS.find(f => f.family === sel.value) || FONTS[0];
      applyTypography();
    });

    const range = $("size-" + t.key);
    const out = $("out-size-" + t.key);
    range.value = sizeOf[t.key];
    if (out) out.textContent = sizeOf[t.key] + "%";
    range.addEventListener("input", () => {
      sizeOf[t.key] = Number(range.value);
      if (out) out.textContent = range.value + "%";
      applyTypography();
    });
  });
  applyTypography();
}

/* =========================
   TEXTOS
   ========================= */

const bind = (input, target) => {
  $(input).addEventListener("input", e => $(target).textContent = e.target.value);
};
bind("topInput", "topText");
bind("mainInput", "mainText");
bind("midInput", "midText");
bind("bottomInput", "bottomText");

/* =========================
   COLORES
   ========================= */

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = ((b - r) / d + 2);
    else h = ((r - g) / d + 4);
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let rgb;

  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return "#" + rgb.map(v => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/* Busca el color más vivo y representativo del fotograma actual
   y lo ajusta para que destaque sobre el fondo. */
function analyzeFrame(media) {
  const W = 160, H = 284;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(media, 0, 0, W, H);

  const data = ctx.getImageData(0, 0, W, H).data;
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 8) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    let bk = buckets.get(key);
    if (!bk) { bk = { n: 0, r: 0, g: 0, b: 0 }; buckets.set(key, bk); }
    bk.n++; bk.r += r; bk.g += g; bk.b += b;
  }
  if (!buckets.size) return null;

  let total = 0, dom = null;
  for (const bk of buckets.values()) {
    total += bk.n;
    if (!dom || bk.n > dom.n) dom = bk;
  }
  const domHsl = rgbToHsl(dom.r / dom.n, dom.g / dom.n, dom.b / dom.n);

  let best = null;
  for (const bk of buckets.values()) {
    const { h, s, l } = rgbToHsl(bk.r / bk.n, bk.g / bk.n, bk.b / bk.n);
    const share = bk.n / total;

    if (s < 0.30) continue;              // fuera grises
    if (l < 0.10 || l > 0.92) continue;  // fuera negros y blancos

    let score = Math.pow(share, 0.4) * (0.35 + s) * (1 - Math.min(1, Math.abs(l - 0.5)) * 0.9);
    score *= hueDistance(h, domHsl.h) > 25 ? 1.18 : 0.82; // premia lo que contrasta con el fondo

    if (!best || score > best.score) best = { h, s, l, score };
  }

  let h, s, l;
  if (best) {
    h = best.h; s = best.s; l = best.l;
  } else {
    // fondo casi gris: usa el complementario del dominante
    h = domHsl.s > 0.12 ? (domHsl.h + 180) % 360 : 353;
    s = 0.85; l = 0.5;
  }

  return hslToHex(h, Math.min(0.95, Math.max(0.62, s * 1.2)), Math.min(0.58, Math.max(0.42, l)));
}

function applyMainColor(color) {
  document.documentElement.style.setProperty("--main-color", color);
  mainText.style.color = color;
  $("bottomText").style.color = color;
  $("colorPicker").value = color;
}

function seekTo(video, time) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish);
    setTimeout(finish, 1200);
    try { video.currentTime = time; } catch (e) { finish(); }
  });
}

async function autoColor() {
  const media = background.querySelector("video,img");
  if (!media) return;

  try {
    // Si el vídeo está en el primer fotograma (suele ser negro), mira un poco más adelante
    if (media.tagName === "VIDEO" && media.readyState >= 2 &&
        media.duration > 0.6 && media.currentTime < 0.15) {
      await seekTo(media, Math.min(1.2, media.duration * 0.3));
    }

    const color = analyzeFrame(media);
    if (color) applyMainColor(color);

    if (media.tagName === "VIDEO") media.play().catch(() => {});
  } catch (err) {
    console.log("Color automático no disponible", err);
  }
}

$("colorPicker").addEventListener("input", e => {
  document.documentElement.style.setProperty("--main-color", e.target.value);
  mainText.style.color = e.target.value;
  $("bottomText").style.color = e.target.value;
});

$("autoColor").addEventListener("click", autoColor);

/* =========================
   MOVIMIENTO Y ZOOM
   ========================= */

function motionPeriod() {
  return 5.2 - Number($("motionRange").value) * 0.38;
}

$("motionRange").addEventListener("input", () => {
  document.querySelectorAll(".text").forEach(el => {
    el.style.animationDuration = motionPeriod() + "s";
  });
});

function applyZoom() {
  const scale = Number($("zoomRange").value) / 100;
  background.style.transform = `scale(${scale})`;
  const media = background.querySelector("video,img");
  if (media) media.style.transform = `scale(${scale})`;
}

$("zoomRange").addEventListener("input", applyZoom);

/* =========================
   GIF ANIMADO
   El canvas solo dibuja el primer frame de un GIF, así que
   decodificamos todos los frames con omggif y los componemos
   en tiempo real para que el vídeo salga animado y completo.
   ========================= */

const gif = {
  reader: null,
  w: 0, h: 0,
  delays: [],
  total: 0,
  canvas: null,
  ctx: null,
  buf: null,
  imgData: null,
  index: -1,
  bg: [0, 0, 0]
};

function resetGif() {
  gif.reader = null;
  gif.canvas = null;
  gif.ctx = null;
  gif.buf = null;
  gif.imgData = null;
  gif.index = -1;
  gif.delays = [];
  gif.total = 0;
  gif.w = 0;
  gif.h = 0;
}

function fillBuffer(buf, r, g, b) {
  const u32 = new Uint32Array(buf.buffer);
  u32.fill(((255 << 24) | (b << 16) | (g << 8) | r) >>> 0);
}

async function loadGif(file) {
  resetGif();
  if (typeof GifReader === "undefined") return false;

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const reader = new GifReader(bytes);
    const w = reader.width;
    const h = reader.height;
    const n = reader.numFrames();
    if (!n) return false;

    // Color de fondo del GIF (para cuando un frame es transparente)
    let bg = [0, 0, 0];
    if (bytes[10] & 0x80) {
      const i = bytes[11];
      bg = [bytes[13 + i * 3], bytes[14 + i * 3], bytes[15 + i * 3]];
    }

    const delays = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      let d = reader.frameInfo(i).delay * 10; // centésimas -> ms
      if (!d || d < 20) d = 100;
      delays.push(d);
      total += d;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;
    ctx.fillRect(0, 0, w, h);

    const buf = new Uint8ClampedArray(w * h * 4);
    fillBuffer(buf, bg[0], bg[1], bg[2]);

    gif.reader = reader;
    gif.w = w;
    gif.h = h;
    gif.delays = delays;
    gif.total = total;
    gif.canvas = canvas;
    gif.ctx = ctx;
    gif.buf = buf;
    gif.imgData = new ImageData(buf, w, h);
    gif.index = -1;
    gif.bg = bg;

    drawGifFrame(0);
    return true;
  } catch (err) {
    console.warn("No se pudo leer el GIF animado:", err);
    resetGif();
    return false;
  }
}

function gifFrameIndexAt(ms) {
  if (!gif.reader || !gif.total) return 0;
  const t = ((ms % gif.total) + gif.total) % gif.total;
  let acc = 0;
  for (let i = 0; i < gif.delays.length; i++) {
    acc += gif.delays[i];
    if (t < acc) return i;
  }
  return gif.delays.length - 1;
}

function drawGifFrame(ms) {
  if (!gif.reader) return;

  const target = gifFrameIndexAt(ms);

  if (target < gif.index) {
    // vuelta al principio: reinicia el lienzo compuesto
    fillBuffer(gif.buf, gif.bg[0], gif.bg[1], gif.bg[2]);
    gif.index = -1;
  }

  while (gif.index < target) {
    gif.index++;
    try {
      gif.reader.decodeAndBlitFrameRGBA(gif.index, gif.buf);
    } catch (err) {
      console.warn("Frame GIF no válido:", gif.index, err);
      break;
    }
  }

  gif.ctx.putImageData(gif.imgData, 0, 0);
}

/* =========================
   SUBIR FONDO
   ========================= */

$("fileInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  if (mediaURL) URL.revokeObjectURL(mediaURL);
  mediaURL = URL.createObjectURL(file);

  if (!lockCustom) setLockBackground(file);

  resetGif();
  background.innerHTML = "";

  if (file.type.startsWith("video/")) {
    const el = document.createElement("video");
    el.src = mediaURL;
    el.autoplay = true;
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.addEventListener("loadeddata", () => { applyZoom(); autoColor(); });
    background.appendChild(el);
    applyZoom();
    exportStatus.textContent = "";
    return;
  }

  const el = document.createElement("img");
  el.src = mediaURL;
  el.onload = () => { applyZoom(); autoColor(); };
  background.appendChild(el);
  applyZoom();

  const isGif = file.type === "image/gif" || /\.gif$/i.test(file.name);
  if (isGif) {
    exportStatus.textContent = "🎞️ Leyendo el GIF animado...";
    const ok = await loadGif(file);
    exportStatus.textContent = ok
      ? `🎞️ GIF completo: ${(gif.total / 1000).toFixed(1)} s (${gif.delays.length} frames). Se exportará entero.`
      : "⚠️ No se pudo animar este GIF; se usará como imagen fija.";
  } else {
    exportStatus.textContent = "";
  }
});

/* =========================
   RESULTADO · PANTALLA DE BLOQUEO
   ========================= */

const lockWall = $("lockWall");
let lockURL = null;
let lockCustom = false;

function setLockBackground(file) {
  if (!file) return;

  if (lockURL) URL.revokeObjectURL(lockURL);
  lockURL = URL.createObjectURL(file);

  lockWall.innerHTML = "";

  const isVideo = (file.type || "").startsWith("video/");
  const el = document.createElement(isVideo ? "video" : "img");

  if (isVideo) {
    el.muted = true;
    el.loop = true;
    el.autoplay = true;
    el.playsInline = true;
  }
  el.src = lockURL;
  lockWall.appendChild(el);
}

function clearLockBackground() {
  if (lockURL) { URL.revokeObjectURL(lockURL); lockURL = null; }
  lockWall.innerHTML = "";
}

$("lockFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  lockCustom = true;
  setLockBackground(file);
});

$("lockReset").addEventListener("click", () => {
  lockCustom = false;
  const file = $("fileInput").files[0];
  if (file) setLockBackground(file);
  else clearLockBackground();
});

/* =========================
   RESTAURAR PLANTILLA
   ========================= */

$("resetBtn").addEventListener("click", () => {
  $("topInput").value = "HIGH QUALITY";
  $("mainInput").value = "WALLPAPERS";
  $("midInput").value = "PREVIEW + LIVE";
  $("bottomInput").value = "DARK FANTASY";

  $("topText").textContent = "HIGH QUALITY";
  mainText.textContent = "WALLPAPERS";
  $("midText").textContent = "PREVIEW + LIVE";
  $("bottomText").textContent = "DARK FANTASY";

  TEXTS.forEach(t => {
    fontOf[t.key] = FONTS.find(f => f.family === t.font) || FONTS[0];
    sizeOf[t.key] = 100;
    $("font-" + t.key).value = fontOf[t.key].family;
    $("size-" + t.key).value = 100;
    $("out-size-" + t.key).textContent = "100%";
  });
  applyTypography();

  $("colorPicker").value = "#e32924";
  mainText.style.color = "#e32924";
  $("bottomText").style.color = "#e32924";

  $("motionRange").value = 2;
  $("zoomRange").value = 100;
  background.style.transform = "scale(1)";
  const media = background.querySelector("video,img");
  if (media) media.style.transform = "scale(1)";
  document.querySelectorAll(".text").forEach(el => el.style.animationDuration = motionPeriod() + "s");
});

/* =========================
   DIBUJO EN CANVAS (1080x1920)
   ========================= */

const CANVAS_W = 1080;
const CANVAS_H = 1920;

function drawTextWithStroke(ctx, text, y, size, color, whiteStyle, time, font, period) {
  const phase = time * Math.PI * 2 / period;
  const bob = Math.sin(phase) * 5;
  const rot = Math.sin(phase) * 0.004;

  ctx.save();
  ctx.translate(CANVAS_W / 2, y + bob);
  ctx.rotate(rot);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.font = `${font.weight} ${size}px "${font.family}", Impact, sans-serif`;

  if (whiteStyle) {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#171717";
    ctx.lineWidth = Math.max(4, size * 0.095);
    ctx.shadowColor = "rgba(0,0,0,.65)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 10;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
  } else {
    ctx.fillStyle = color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(4, size * 0.085);
    ctx.shadowColor = "rgba(0,0,0,.8)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 12;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
  }
  ctx.restore();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrapped(ctx, text, y, size, color, whiteStyle, time, font, period) {
  ctx.font = `${font.weight} ${size}px "${font.family}", Impact, sans-serif`;
  const lines = wrapLines(ctx, text, 980);
  const lineHeight = size * 0.9;
  const startY = y - (lines.length - 1) * lineHeight / 2;

  lines.forEach((line, i) => {
    drawTextWithStroke(ctx, line, startY + i * lineHeight, size, color, whiteStyle, time, font, period);
  });
}

function renderFrame(ctx, media, elapsed, period) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  const zoom = Number($("zoomRange").value) / 100;

  let source = media;
  let sw, sh;

  if (gif.reader) {
    drawGifFrame(elapsed * 1000);
    source = gif.canvas;
    sw = gif.w;
    sh = gif.h;
  } else {
    sw = media.videoWidth || media.naturalWidth || CANVAS_W;
    sh = media.videoHeight || media.naturalHeight || CANVAS_H;
  }

  const scale = Math.max(CANVAS_W / sw, CANVAS_H / sh) * zoom;
  const w = sw * scale;
  const h = sh * scale;

  try { ctx.drawImage(source, (CANVAS_W - w) / 2, (CANVAS_H - h) / 2, w, h); } catch (e) {}

  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, "rgba(0,0,0,.18)");
  grad.addColorStop(.35, "rgba(0,0,0,0)");
  grad.addColorStop(.7, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,.28)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const mainColor = $("colorPicker").value;

  TEXTS.forEach(t => {
    const size = t.canvas * sizeOf[t.key] / 100;
    const color = t.white ? "#ffffff" : mainColor;
    drawWrapped(ctx, $(t.input).value, t.y, size, color, t.white, elapsed, fontOf[t.key], period);
  });
}

async function ensureFonts() {
  try {
    await Promise.all(TEXTS.map(t => document.fonts.load(`${fontOf[t.key].weight} 100px "${fontOf[t.key].family}"`)));
    await document.fonts.ready;
  } catch (e) {}
}

/* =========================
   EXPORTAR MP4
   ========================= */

const exportBtn = $("exportBtn");
const exportStatus = $("exportStatus");

/* Orden de preferencia: MP4 H.264 primero (CapCut/TikTok lo aceptan),
   WebM solo como último recurso. */
const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.640028",
  "video/mp4;codecs=avc1.4D4028",
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4;codecs=avc1",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm"
];

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find(t => {
    try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; }
  }) || "";
}

function showResult(blob, filename, isMp4) {
  if (resultURL) URL.revokeObjectURL(resultURL);
  resultURL = URL.createObjectURL(blob);

  const video = $("resultVideo");
  video.src = resultURL;
  video.play().catch(() => {});

  const link = $("downloadLink");
  link.href = resultURL;
  link.download = filename;
  link.textContent = isMp4 ? "⬇️ Descargar MP4" : "⬇️ Descargar WebM";

  $("resultInfo").textContent =
    `${filename} · ${(blob.size / 1048576).toFixed(1)} MB · 1080×1920 · 30 fps`;

  const box = $("result");
  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Descarga automática (si el navegador la permite, queda el botón de arriba)
  try { link.click(); } catch (e) {}
}

/* Espera a que el vídeo tenga un frame decodificado */
function waitForVideoFrame(video, timeout = 3000) {
  return new Promise(resolve => {
    if (video.readyState >= 2 && video.videoWidth) return resolve();

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("seeked", finish);
      video.removeEventListener("canplay", finish);
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(finish, timeout);
    video.addEventListener("loadeddata", finish);
    video.addEventListener("seeked", finish);
    video.addEventListener("canplay", finish);
  });
}

/* Deja pasar N frames de animación (para que el encoder capture lo ya pintado) */
function nextAnimationFrames(n = 2) {
  return new Promise(resolve => {
    let i = 0;
    const step = () => {
      if (++i >= n) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

exportBtn.addEventListener("click", async () => {
  const media = background.querySelector("video,img");
  if (!media) {
    exportStatus.textContent = "⚠️ Primero sube un vídeo, GIF o imagen.";
    return;
  }

  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    exportStatus.textContent = "❌ Este navegador no permite exportar vídeo. Usa Chrome o Edge actualizado.";
    return;
  }

  const mime = pickMime();
  if (!mime) {
    exportStatus.textContent = "❌ Tu navegador no soporta grabación de vídeo. Usa Chrome o Edge actualizado.";
    return;
  }

  exportBtn.disabled = true;
  exportStatus.textContent = "Preparando exportación...";

  try {
    await ensureFonts();

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");

    const period = motionPeriod();

    let duration;
    if (gif.reader) {
      // El GIF se exporta entero (una vuelta completa); si es muy corto,
      // se repite el bucle hasta 2 s para que sea usable.
      duration = Math.max(gif.total / 1000, 2);
    } else if (media.tagName === "VIDEO") {
      duration = Math.min(Math.max(media.duration || 5, 3), 15);
    } else {
      duration = 5;
    }

    /* --- 1. Preparar la fuente --- */
    if (media.tagName === "VIDEO") {
      try {
        media.pause();
        media.muted = true;
        media.currentTime = 0;
        await waitForVideoFrame(media);
      } catch (e) {}
    } else if (typeof media.decode === "function") {
      try { await media.decode(); } catch (e) {}
    }

    /* --- 2. Pintar el primer frame ANTES de crear el stream ---
       Si el grabador arranca con el canvas vacío, el vídeo empieza en negro. */
    renderFrame(ctx, media, 0, period);

    const stream = canvas.captureStream(30);

    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    } catch (e) {
      recorder = new MediaRecorder(stream, { videoBitsPerSecond: 12000000 });
    }

    const usedMime = recorder.mimeType || mime;
    const isMp4 = /mp4/i.test(usedMime);

    const chunks = [];
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const done = new Promise(resolve => { recorder.onstop = resolve; });

    recorder.start(250);

    /* --- 3. Confirmar que el encoder ya tiene esa imagen y arrancar el reloj --- */
    await nextAnimationFrames(2);

    if (media.tagName === "VIDEO") {
      try { await media.play(); } catch (e) {}
    }

    const start = performance.now();

    await new Promise(resolve => {
      function frame(now) {
        const elapsed = (now - start) / 1000;
        renderFrame(ctx, media, elapsed, period);

        const progress = Math.min(99, Math.round(elapsed / duration * 100));
        exportStatus.textContent = `🎬 Exportando... ${progress}%`;

        if (elapsed < duration) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });

    // margen para capturar el último fotograma
    await new Promise(r => setTimeout(r, 150));
    if (media.tagName === "VIDEO") media.pause();
    if (recorder.state !== "inactive") recorder.stop();
    await done;

    const blob = new Blob(chunks, { type: usedMime });
    if (!blob.size) throw new Error("la grabación salió vacía");

    const filename = `wallpaper-text.${isMp4 ? "mp4" : "webm"}`;
    showResult(blob, filename, isMp4);

    exportStatus.textContent = isMp4
      ? `✅ Listo: MP4 de ${(blob.size / 1048576).toFixed(1)} MB. Ya puedes importarlo en CapCut.`
      : `✅ Listo, pero en WebM: tu navegador no permite MP4. Abre la web en Chrome/Edge para obtener MP4.`;
  } catch (err) {
    console.error(err);
    exportStatus.textContent = "❌ Error al exportar: " + err.message;
  } finally {
    exportBtn.disabled = false;
    const media = background.querySelector("video");
    if (media) media.play().catch(() => {});
  }
});

/* =========================
   INICIO
   ========================= */

buildTypoControls();
document.querySelectorAll(".text").forEach(el => el.style.animationDuration = motionPeriod() + "s");
