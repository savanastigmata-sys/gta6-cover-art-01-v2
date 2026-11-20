// Palm City Poster Lab — the cover renderer.
// Draws the whole poster onto any 2D canvas at any size: sky, photo and
// graphic panels, skyline, grade wash, title band, stars, badge, grain.
// Pure drawing: it takes the state and a map of loaded images and returns
// the panels it drew (in cover coordinates) for the editor's hit test.

import { GRADES, LAYOUTS, SIZES } from './state.js';

let noiseTile = null;

function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  noiseTile = tile;
  return tile;
}

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.45, x + s * 0.16, y - s * 0.72);
  ctx.stroke();
  const tx = x + s * 0.16;
  const ty = y - s * 0.72;
  ctx.lineWidth = Math.max(1.5, s * 0.032);
  // Fronds arc out and droop at the tip, like a real palm, instead of
  // shooting straight out.
  const fronds = [-155, -115, -75, -35, 5];
  for (const deg of fronds) {
    const a = (deg * Math.PI) / 180;
    const ex = tx + Math.cos(a) * s * 0.36;
    const ey = ty + Math.sin(a) * s * 0.36 + s * 0.17;
    const mx = tx + Math.cos(a) * s * 0.2;
    const my = ty + Math.sin(a) * s * 0.2 - s * 0.06;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkyline(ctx, x, y, w, h, color, accent) {
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  while (bx < x + w) {
    const bw = w * (0.04 + next() * 0.05);
    const bh = h * (0.35 + next() * 0.6);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if (next() > 0.5) {
      ctx.fillRect(bx + bw * 0.3, y + h - bh - h * 0.12, bw * 0.4, h * 0.12);
    }
    bx += bw + w * 0.008;
  }
  ctx.fillStyle = accent;
  for (let i = 0; i < Math.floor(w / 34); i++) {
    const wx = x + 12 + i * 34 + next() * 14;
    const wy = y + h * 0.2 + next() * h * 0.6;
    ctx.globalAlpha = 0.5 + next() * 0.5;
    ctx.fillRect(wx, wy, 3, 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRetroSun(ctx, x, y, w, h, grade) {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, grade.sky[0]);
  grad.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  const r = Math.min(w, h) * 0.36;
  const cx = x + w / 2;
  const cy = y + h * 0.46;
  const sun = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  sun.addColorStop(0, grade.title[0]);
  sun.addColorStop(1, grade.accent);
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grad;
  let sy = cy + r * 0.05;
  let gap = r * 0.1;
  while (sy < cy + r) {
    ctx.fillRect(cx - r - 2, sy, r * 2 + 4, gap);
    sy += gap + r * 0.16;
    gap *= 1.5;
  }
}

function drawHalftone(ctx, x, y, w, h, color, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  const step = Math.max(10, w / 12);
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const fade = 1 - (col / Math.max(1, Math.ceil(w / step))) * 0.7;
      const r = step * 0.22 * fade + 0.5;
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGraphicPanel(ctx, panel, grade) {
  const { x, y, w, h } = panel;
  if (panel.kind === 'sun') {
    drawRetroSun(ctx, x, y, w, h, grade);
  } else if (panel.kind === 'halftone') {
    drawHalftone(ctx, x, y, w, h, grade.accent, grade.band);
  } else if (panel.kind === 'palms') {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, grade.sky[1]);
    grad.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    drawPalm(ctx, x + w * 0.3, y + h * 0.98, h * 0.8, grade.band);
    drawPalm(ctx, x + w * 0.72, y + h * 0.98, h * 0.62, grade.band);
  } else if (panel.kind === 'stripes') {
    ctx.fillStyle = grade.band;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = grade.accent;
    for (let i = -h; i < w + h; i += 46) {
      ctx.save();
      ctx.translate(x + i, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(0, -h, 18, h * 3);
      ctx.restore();
    }
    ctx.restore();
  } else {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, grade.sky[0]);
    grad.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
}

function drawPhotoPanel(ctx, panel, img, photo, crop, grade, strength) {
  const { x, y, w, h } = panel;
  if (!img) {
    drawGraphicPanel(ctx, { ...panel, kind: 'palms' }, grade);
    return;
  }
  ctx.save();
  ctx.beginPath();
  if (panel.diag) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h * 0.16);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.clip();
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  // Cover-fit, but centre the visible window on the photo's focus point
  // (the face) instead of the image centre, so a portrait photo in a wide
  // panel keeps the face instead of cropping it off.
  const s = Math.max(w / iw, h / ih) * (crop.zoom || 1);
  const dw = iw * s;
  const dh = ih * s;
  const vw = w / s;
  const vh = h / s;
  const fx = (photo && photo.focus && photo.focus.fx) ?? 0.5;
  const fy = (photo && photo.focus && photo.focus.fy) ?? 0.35;
  let cx = fx * iw + (crop.ox || 0) * vw;
  let cy = fy * ih + (crop.oy || 0) * vh;
  if (vw >= iw) cx = iw / 2;
  else cx = Math.min(Math.max(cx, vw / 2), iw - vw / 2);
  if (vh >= ih) cy = ih / 2;
  else cy = Math.min(Math.max(cy, vh / 2), ih - vh / 2);
  const dx = x + w / 2 - cx * s;
  const dy = y + h / 2 - cy * s;
  ctx.save();
  if (crop.flip) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(img, dx - (x + w / 2), dy - (y + h / 2), dw, dh);
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
  // Grade wash over the photo, still inside the panel clip.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.45 * strength;
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.16 * strength;
  const wash = ctx.createLinearGradient(x, y, x, y + h);
  wash.addColorStop(0, 'rgba(255,255,255,0)');
  wash.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.restore();
}

function drawPanelFrame(ctx, panel, border) {
  ctx.save();
  ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
  ctx.rotate((panel.rot * Math.PI) / 180);
  ctx.fillStyle = '#fff8f0';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = border * 3;
  ctx.shadowOffsetY = border * 0.8;
  ctx.fillRect(-panel.w / 2 - border, -panel.h / 2 - border, panel.w + border * 2, panel.h + border * 2);
  ctx.restore();
}

// Draws the cover described by `state` onto ctx at W x H. `images` maps a
// photo id to a loaded image element. Returns the panels drawn, in cover
// coordinates, for the editor's click hit test.
export function drawCover(ctx, state, images, W, H) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const size = SIZES[state.size] || SIZES.landscape;
  const strength = state.gradeStrength == null ? 0.85 : state.gradeStrength;
  const pad = Math.round(W * 0.022);
  const bandH = Math.round(H * (state.size === 'portrait' ? 0.235 : 0.26));
  const bandTop = H - bandH;
  const gap = Math.max(6, Math.round(W * 0.007));

  // Sky behind everything.
  const sky = ctx.createLinearGradient(0, 0, 0, bandTop);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Photo area and its panels.
  const area = { x: pad, y: pad, w: W - 2 * pad, h: bandTop - 2 * pad };
  const layout = LAYOUTS[state.layout] || LAYOUTS.heroThree;
  const panels = layout.panels(area.x, area.y, area.w, area.h, gap);
  const border = Math.max(3, Math.round(W * 0.004));

  for (const panel of panels) {
    drawPanelFrame(ctx, panel, border);
    ctx.save();
    ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
    ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.translate(-panel.w / 2, -panel.h / 2);
    const local = { ...panel, x: 0, y: 0 };
    if (panel.kind === 'photo') {
      const photo = state.photos[state.assign[panel.slot] ?? 0];
      const img = photo ? images.get(photo.id) || null : null;
      drawPhotoPanel(ctx, local, img, photo, state.crops[panel.slot] || { zoom: 1, ox: 0, oy: 0, flip: false }, grade, strength);
    } else {
      drawGraphicPanel(ctx, local, grade);
    }
    ctx.restore();
  }

  // Skyline + palms along the seam above the title band.
  const skyH = Math.round(H * 0.052);
  drawSkyline(ctx, pad, bandTop - skyH, W - 2 * pad, skyH, grade.band, grade.accent);
  drawPalm(ctx, pad + W * 0.06, bandTop, skyH * 1.5, grade.band);
  drawPalm(ctx, W - pad - W * 0.05, bandTop, skyH * 1.25, grade.band);

  // Title band: dense, no empty middle.
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandTop, W, bandH);
  ctx.fillStyle = grade.bandLine;
  ctx.fillRect(0, bandTop, W, Math.max(3, bandH * 0.02));
  ctx.fillStyle = grade.bandLine;
  ctx.fillRect(0, H - Math.max(3, bandH * 0.02), W, Math.max(3, bandH * 0.02));

  // Halftone corner, right side of the band.
  const htX = W - pad - Math.round(W * 0.17);
  const htY = bandTop + bandH * 0.3;
  const htW = Math.round(W * 0.15);
  const htH = bandH * 0.34;
  ctx.fillStyle = grade.accent;
  const step = Math.max(9, htW / 11);
  for (let row = 0; row * step < htH; row++) {
    for (let col = 0; col * step < htW; col++) {
      const fade = 1 - (col / Math.max(1, Math.ceil(htW / step))) * 0.65;
      ctx.beginPath();
      ctx.arc(htX + col * step + step / 2, htY + row * step + step / 2, step * 0.2 * fade + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Badge ribbon, top right of the band.
  const badgeText = (state.badge || '').trim().toUpperCase();
  if (badgeText) {
    ctx.font = `${Math.max(13, Math.round(bandH * 0.16))}px Anton, sans-serif`;
    const bw = ctx.measureText(badgeText).width + bandH * 0.3;
    const bh = bandH * 0.24;
    ctx.save();
    // Anchor the ribbon's right edge inside the pad so a long badge is
    // never clipped by the cover's edge.
    ctx.translate(W - pad - bw / 2 - 6, bandTop + bandH * 0.14);
    ctx.rotate((-5 * Math.PI) / 180);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = grade.band;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 0, 1);
    ctx.restore();
  }

  // Title: Anton, gradient fill, dark outline, fitted to the band width.
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let sizePx = bandH * 0.52;
    ctx.font = `${sizePx}px Anton, sans-serif`;
    const maxW = W - 2 * pad;
    while (ctx.measureText(title).width > maxW && sizePx > 14) {
      sizePx -= 2;
      ctx.font = `${sizePx}px Anton, sans-serif`;
    }
    const grad = ctx.createLinearGradient(0, bandTop + bandH * 0.12, 0, bandTop + bandH * 0.62);
    grad.addColorStop(0, grade.title[0]);
    grad.addColorStop(1, grade.title[1]);
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, sizePx * 0.055);
    ctx.strokeStyle = grade.stroke;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = sizePx * 0.08;
    ctx.shadowOffsetY = sizePx * 0.03;
    const ty = bandTop + bandH * 0.56;
    ctx.strokeText(title, pad, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, pad, ty);
    ctx.restore();
  }

  // Subtitle: Pacifico script, neon glow, right side under the title.
  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    const subPx = Math.max(15, bandH * 0.17);
    ctx.save();
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = grade.sub;
    ctx.shadowColor = grade.sub;
    ctx.shadowBlur = subPx * 0.45;
    ctx.fillText(subtitle, W - pad, bandTop + bandH * 0.82);
    ctx.restore();
  }

  // Star meter, bottom left.
  const starR = Math.max(7, bandH * 0.075);
  const starY = bandTop + bandH * 0.88;
  for (let i = 0; i < 5; i++) {
    const cx = pad + starR + i * starR * 2.4;
    ctx.save();
    if (i < state.stars) {
      ctx.fillStyle = grade.accent;
      ctx.shadowColor = grade.accent;
      ctx.shadowBlur = starR * 0.6;
      starPath(ctx, cx, starY, starR);
      ctx.fill();
    } else {
      ctx.strokeStyle = grade.accent;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.5;
      starPath(ctx, cx, starY, starR);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Footer microcopy, centred on the band's bottom edge.
  ctx.save();
  ctx.font = `600 ${Math.max(10, Math.round(bandH * 0.085))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('PALM CITY  •  POSTER LAB', W / 2, H - Math.max(8, bandH * 0.07));
  ctx.restore();

  // Grain and vignette over the finished poster.
  if (state.grain) {
    const tile = getNoiseTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.26)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  // Thin outer frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeRect(pad / 2, pad / 2, W - pad, H - pad);

  return { panels, bandTop, bandH, size };
}

export function sizeOf(state) {
  return SIZES[state.size] || SIZES.landscape;
}
