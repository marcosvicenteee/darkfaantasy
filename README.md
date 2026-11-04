# Dark Fantasy · Wallpaper Text Generator

Mini web que convierte un **vídeo, GIF o imagen** en una portada 9:16 con texto animado y la exporta en **MP4 (H.264) 1080×1920**, lista para CapCut / TikTok.

## Funciones

- **Exportación MP4 real** (no WebM): `wallpaper-text.mp4`, 1080×1920, 30 fps.
- **GIF animado completo**: se decodifican todos los frames (omggif) y se exporta toda la animación, no solo el primer frame.
- **Tipografía independiente** para cada uno de los 4 textos (10 fuentes) + tamaño de 60 % a 170 %.
- **Color que combina**: analiza el fondo y elige el tono más vivo que contrasta con la imagen.
- Vista previa idéntica al vídeo exportado (mismas proporciones y posiciones).
- Botones superiores: MP4, FOTOS y TO GIF.

## Uso

Abre `index.html` en Chrome o Edge (o sírvelo con `python -m http.server 8000`).

1. Sube el fondo.
2. Escribe los textos y elige tipografía y tamaño de cada uno.
3. Pulsa 🎨 para el color automático (también se aplica al subir el archivo).
4. Exporta y descarga el MP4.

> En local, el MP4 se graba con el `MediaRecorder` del navegador; en Chrome/Edge funciona tanto en `localhost` como por red local.
> En el móvil, usa el enlace `http://IP-del-PC:8000` estando en la misma WiFi.

## Estructura

```
index.html        interfaz
style.css         estilos (incluye preview proporcional al vídeo)
app.js            lógica: tipografías, color automático, GIF y exportación
vendor/omggif.js  decodificador de GIF (MIT, Dean McNamee)
server.js         servidor estático mínimo para Render (sin dependencias)
```

## Despliegue en Render

**Opción recomendada:** *New → Static Site*
- Build Command: *(vacío)*
- Publish Directory: `.`

**Opción Web Service** (ya creado):
- Build Command: `echo ok`
- Start Command: `node server.js`

El servidor escucha en `process.env.PORT` y sirve la carpeta del proyecto.

## Auto-ping (evitar que Render duerma el servicio)

En el plan free el servicio se duerme a los **15 min** sin visitas. `server.js` se hace una petición a sí mismo para mantenerse despierto:

| Variable | Descripción | Por defecto |
|---|---|---|
| `SELF_URL` | URL pública del servicio, ej. `https://darkfaantasy.onrender.com` | `RENDER_EXTERNAL_URL` (Render la pone sola) |
| `SELF_PING_MINUTES` | Minutos entre pings (`0` lo desactiva) | `10` |

- Endpoint usado: `GET /__ping` → `200 ok` (no toca los archivos estáticos).
- El primer ping se lanza a los 10 s de arrancar, luego cada 10 min.
- **Sin configurar nada** funciona en Render, porque expone `RENDER_EXTERNAL_URL` automáticamente.
- Ojo: el plan free tiene ~750 h/mes de instancia; mantenerlo 24/7 consume ~730 h. Si un mes haces despliegues o pruebas, te quedarás justo.



## Créditos

- GIF: [omggif](https://github.com/deanm/omggif) (MIT)
- Fuentes: Google Fonts
