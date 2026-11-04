// Servidor estático mínimo para Render (sin dependencias)
// Uso local: node server.js  ->  http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function send(res, code, body, type) {
  res.writeHead(code, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": code === 200 ? "no-cache" : "no-store"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let url;

  try {
    url = decodeURIComponent((req.url || "/").split("?")[0]);
  } catch (e) {
    return send(res, 400, "400 · URL no válida");
  }

  // Endpoint ligero para el auto-ping
  if (url === "/__ping") {
    return send(res, 200, "ok", "text/plain; charset=utf-8");
  }

  let filePath = path.resolve(ROOT, "." + url);

  // Nunca salir de la carpeta del proyecto
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, "403 · Prohibido");
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (err2, data) => {
      if (err2) return send(res, 404, "<h1>404</h1><p>No encontrado</p>", "text/html; charset=utf-8");

      const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": /\.html?$/i.test(filePath) ? "no-cache" : "public, max-age=3600"
      });

      if (req.method === "HEAD") res.end();
      else res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log("Sirviendo " + ROOT + " en el puerto " + PORT);
  startSelfPing();
});

/* =========================================================
   AUTO-PING (mantiene despierto el servicio free de Render,
   que se duerme tras 15 minutos sin visitas)
   Variables de entorno:
     SELF_URL          -> URL pública (si no, usa RENDER_EXTERNAL_URL)
     SELF_PING_MINUTES -> minutos entre pings (por defecto 10, 0 = off)
   ========================================================= */

function startSelfPing() {
  const base = process.env.SELF_URL || process.env.RENDER_EXTERNAL_URL || "";
  const minutes = Number(process.env.SELF_PING_MINUTES || 10);

  if (!base) {
    console.log("[ping] desactivado: define SELF_URL (o despliega en Render, que expone RENDER_EXTERNAL_URL)");
    return;
  }

  if (!(minutes > 0)) {
    console.log("[ping] desactivado: SELF_PING_MINUTES = " + minutes);
    return;
  }

  let target;
  try {
    target = new URL("/__ping", base).toString();
  } catch (e) {
    console.warn("[ping] desactivado: SELF_URL no es una URL válida (" + base + ")");
    return;
  }

  const every = minutes * 60 * 1000;

  const ping = async () => {
    const t0 = Date.now();
    try {
      const res = await fetch(target, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "self-ping" }
      });
      console.log("[ping] " + res.status + " " + target + " (" + (Date.now() - t0) + " ms)");
    } catch (err) {
      console.warn("[ping] error: " + err.message);
    }
  };

  // primer ping cuando el servicio ya está arriba
  setTimeout(ping, 10000).unref();
  setInterval(ping, every).unref();

  console.log("[ping] activo cada " + minutes + " min -> " + target);
}
