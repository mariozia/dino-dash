// All visual art in this game is loaded from real generated assets in
// assets/images/ (3D-rendered toy-style art via Higgsfield, recraft-v4-1
// and soul_cinematic, background-removed where transparency is needed —
// see higgsfield-prompts.md for the prompts used). Drawing here is just
// compositing those images onto the game canvas.

const ASSET_PATH = "assets/images/";

function loadImage(name) {
  const img = new Image();
  img.src = ASSET_PATH + name;
  return img;
}

function readyImg(img) {
  return !!img && img.complete && img.naturalWidth > 0;
}

const IMAGES = {
  bgSky: loadImage("bg-sky.png"),
  bgJungle: loadImage("bg-jungle.png"),
  meteor: loadImage("meteor.png"),
};

const CHARACTER_IMAGES = {
  raptor: loadImage("dino-raptor.png"),
  compy: loadImage("dino-compy.png"),
  dilo: loadImage("dino-dilo.png"),
  pachy: loadImage("dino-pachy.png"),
  stego: loadImage("dino-stego.png"),
  anky: loadImage("dino-anky.png"),
  trike: loadImage("dino-trike.png"),
  spino: loadImage("dino-spino.png"),
  trex: loadImage("dino-trex.png"),
};

// Draws img into the x,y,w,h box using object-fit: cover (crops, never distorts).
function drawCover(ctx, img, x, y, w, h) {
  if (!readyImg(img)) return;
  const ir = img.naturalWidth / img.naturalHeight;
  const r = w / h;
  let sx, sy, sw, sh;
  if (ir > r) {
    sh = img.naturalHeight;
    sw = sh * r;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / r;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Draws img centered at (cx,cy), scaled to fit within maxW x maxH without
// distorting its aspect ratio (object-fit: contain).
function drawContain(ctx, img, cx, cy, maxW, maxH) {
  if (!readyImg(img)) return;
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

// Tiles img horizontally (scaled to displayH tall) so it scrolls seamlessly,
// bottom-aligned at bottomY and offset by a parallax scroll amount.
function drawTiledLayer(ctx, img, w, offset, displayH, bottomY) {
  if (!readyImg(img)) return;
  const scale = displayH / img.naturalHeight;
  const dw = img.naturalWidth * scale;
  if (dw <= 0) return;
  let start = -(((offset % dw) + dw) % dw);
  if (start > 0) start -= dw;
  for (let x = start; x < w + dw; x += dw) {
    ctx.drawImage(img, x, bottomY - displayH, dw, displayH);
  }
}

// ---------- Background ----------
// The jungle silhouette layer extends all the way to the bottom edge so the
// ground area is just a continuation of the same scene, not a separate image.
function drawBackground(ctx, w, h, scrollX) {
  drawCover(ctx, IMAGES.bgSky, 0, 0, w, h);
  drawTiledLayer(ctx, IMAGES.bgJungle, w, scrollX * 0.4, h * 0.55, h);
}

// ---------- Meteor obstacle ----------
function drawMeteor(ctx, x, y, w, h, pointingDown) {
  // pointingDown: true for a meteor hanging from the ceiling, false for one
  // rising from the ground — mirrored vertically so the pair reads as a gap.
  ctx.save();
  if (pointingDown) {
    // flipping around y also flips the box to [-h, 0], so shift down by h
    // first to land back in [y, y+h] instead of vanishing above the canvas.
    ctx.translate(x, y + h);
    ctx.scale(1, -1);
  } else {
    ctx.translate(x, y);
  }

  const glow = ctx.createRadialGradient(w / 2, h * 0.15, 2, w / 2, h * 0.15, w * 1.4);
  glow.addColorStop(0, "rgba(255,140,40,0.45)");
  glow.addColorStop(1, "rgba(255,140,40,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-w * 0.5, -h * 0.1, w * 2, h * 1.3);

  if (readyImg(IMAGES.meteor)) {
    ctx.drawImage(IMAGES.meteor, 0, 0, w, h);
  }

  ctx.restore();
}

// ---------- Dino character ----------
// Draws a dino centered at (0,0) facing right.
function drawDino(ctx, character, t, rotationDeg) {
  const feats = new Set(character.features || []);
  const big = feats.has("big") ? 1.18 : feats.has("small") ? 0.8 : 1;
  const img = CHARACTER_IMAGES[character.id];

  ctx.save();
  ctx.rotate((rotationDeg * Math.PI) / 180);
  // generated sprites face left; flip horizontally so they face the
  // direction of travel (right), same as the scale used for big/small.
  ctx.scale(-big, big);

  if (feats.has("glow")) {
    ctx.shadowColor = "rgba(255,140,40,0.8)";
    ctx.shadowBlur = 14;
  }

  drawContain(ctx, img, 0, 0, 100, 100);

  ctx.shadowBlur = 0;
  ctx.restore();
}

// Render a character into a small standalone canvas (used by the store grid).
function renderCharacterIcon(canvas, character) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const img = CHARACTER_IMAGES[character.id];
  ctx.clearRect(0, 0, size, size);
  if (readyImg(img)) {
    const pad = size * 0.08;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.scale(-1, 1);
    drawContain(ctx, img, 0, 0, size - pad * 2, size - pad * 2);
    ctx.restore();
  } else if (img) {
    img.addEventListener("load", () => renderCharacterIcon(canvas, character), { once: true });
  }
}
