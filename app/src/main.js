// Palm City Poster Lab — the editor.
// Wires the rail, the live preview and the export bar to the state and the
// renderer. A `?shot=` query hands control to shots.js instead, so the
// screenshot scenes render the same app with a fixed state.

import { drawCover, sizeOf } from './cover.js';
import { GRADES, GRADE_ORDER, LAYOUTS, LAYOUT_ORDER, PHOTOS, PRESETS, PRESET_ORDER, SURPRISE_TITLES, cloneState, defaultState } from './state.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

let state = defaultState();
let images = new Map();
let lastPanels = [];
let undoStack = [];
let redoStack = [];
let frameCount = 0;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadAllPhotos() {
  for (const photo of state.photos) {
    if (images.has(photo.id)) continue;
    try {
      images.set(photo.id, await loadImage(photo.src));
    } catch {
      images.set(photo.id, null);
    }
  }
}

function pushHistory() {
  undoStack.push(cloneState(state));
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncHistoryButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(cloneState(state));
  state = undoStack.pop();
  syncHistoryButtons();
  renderAll();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(cloneState(state));
  state = redoStack.pop();
  syncHistoryButtons();
  renderAll();
}

function syncHistoryButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

function photoPanels() {
  return lastPanels.filter((p) => p.kind === 'photo');
}

function selectedPanel() {
  const photos = photoPanels();
  return photos[Math.min(state.selected, Math.max(0, photos.length - 1))] || null;
}

function drawSelection() {
  const panel = selectedPanel();
  if (!panel) return;
  const scale = Math.max(2, Math.round(canvas.width * 0.002));
  ctx.save();
  ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
  ctx.rotate((panel.rot * Math.PI) / 180);
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = scale;
  ctx.strokeStyle = '#22d3ee';
  ctx.strokeRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
  ctx.setLineDash([]);
  ctx.fillStyle = '#22d3ee';
  const label = `FRAME ${panel.slot + 1}`;
  ctx.font = `${Math.round(scale * 7)}px Anton, sans-serif`;
  const tw = ctx.measureText(label).width;
  ctx.fillRect(-panel.w / 2, -panel.h / 2 - scale * 11, tw + scale * 6, scale * 11);
  ctx.fillStyle = '#0d0221';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, -panel.w / 2 + scale * 3, -panel.h / 2 - scale * 5.5);
  ctx.restore();
}

function renderPreview() {
  const size = sizeOf(state);
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const result = drawCover(ctx, state, images, size.w, size.h);
  lastPanels = result.panels;
  drawSelection();
}

function renderTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const img = images.get(photo.id);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'thumb';
    cell.draggable = true;
    cell.title = photo.label;
    cell.setAttribute('aria-label', `Use photo ${photo.label}`);
    if (img) {
      const thumb = document.createElement('img');
      thumb.src = photo.src;
      thumb.alt = photo.label;
      thumb.draggable = false;
      cell.appendChild(thumb);
    } else {
      cell.textContent = photo.label;
    }
    const tag = document.createElement('span');
    tag.className = 'thumb-tag';
    tag.textContent = photo.label;
    cell.appendChild(tag);
    cell.addEventListener('click', () => assignPhoto(i));
    cell.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/palm-photo', String(i));
    });
    tray.appendChild(cell);
  });
}

function renderChips() {
  const box = $('layouts');
  box.innerHTML = '';
  for (const key of LAYOUT_ORDER) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (state.layout === key ? ' active' : '');
    b.textContent = LAYOUTS[key].label;
    b.addEventListener('click', () => {
      if (state.layout === key) return;
      pushHistory();
      state.layout = key;
      state.selected = 0;
      renderAll();
    });
    box.appendChild(b);
  }
}

function renderGrades() {
  const box = $('grades');
  box.innerHTML = '';
  for (const key of GRADE_ORDER) {
    const g = GRADES[key];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (state.grade === key ? ' active' : '');
    b.style.background = `linear-gradient(135deg, ${g.sky[0]}, ${g.sky[1]} 55%, ${g.sky[2]})`;
    b.textContent = g.label;
    b.addEventListener('click', () => {
      if (state.grade === key) return;
      pushHistory();
      state.grade = key;
      renderAll();
    });
    box.appendChild(b);
  }
}

function renderStars() {
  const box = $('stars');
  box.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'star' + (i <= state.stars ? ' on' : '');
    b.textContent = '★';
    b.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
    b.addEventListener('click', () => {
      if (state.stars === i) return;
      pushHistory();
      state.stars = i;
      renderAll();
    });
    box.appendChild(b);
  }
}

function renderPresets() {
  const box = $('presets');
  box.innerHTML = '';
  for (const key of PRESET_ORDER) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset';
    b.textContent = PRESETS[key].label;
    b.addEventListener('click', () => applyPreset(key));
    box.appendChild(b);
  }
}

function renderPanelTools() {
  const panel = selectedPanel();
  const tools = $('panelTools');
  if (!panel) {
    tools.hidden = true;
    return;
  }
  tools.hidden = false;
  const photo = state.photos[state.assign[panel.slot] ?? 0];
  $('panelName').textContent = `Frame ${panel.slot + 1} — ${photo ? photo.label : 'empty'}`;
  const crop = state.crops[panel.slot] || { zoom: 1, ox: 0, oy: 0, flip: false };
  $('zoom').value = crop.zoom;
  $('panX').value = crop.ox;
  $('panY').value = crop.oy;
  $('zoomVal').textContent = `${Math.round(crop.zoom * 100)}%`;
  $('flipBtn').textContent = crop.flip ? 'Flipped ✓' : 'Flip';
}

function renderWords() {
  if (document.activeElement !== $('title')) $('title').value = state.title;
  if (document.activeElement !== $('subtitle')) $('subtitle').value = state.subtitle;
  if (document.activeElement !== $('badge')) $('badge').value = state.badge;
  $('strength').value = Math.round(state.gradeStrength * 100);
  $('strengthVal').textContent = `${Math.round(state.gradeStrength * 100)}%`;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
}

function renderSizes() {
  for (const key of ['square', 'portrait', 'landscape']) {
    const b = $(`size-${key}`);
    if (b) b.classList.toggle('active', state.size === key);
  }
}

function renderAll() {
  renderPreview();
  renderTray();
  renderChips();
  renderGrades();
  renderStars();
  renderPanelTools();
  renderWords();
  renderSizes();
}

function assignPhoto(photoIndex) {
  const panel = selectedPanel();
  if (!panel) return;
  if ((state.assign[panel.slot] ?? 0) === photoIndex) return;
  pushHistory();
  state.assign[panel.slot] = photoIndex;
  renderAll();
}

function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  pushHistory();
  state.size = p.size;
  state.layout = p.layout;
  state.grade = p.grade;
  state.title = p.title;
  state.subtitle = p.subtitle;
  state.stars = p.stars;
  state.badge = p.badge;
  state.selected = 0;
  setStatus(`Preset “${p.label}” applied — tweak it, then export.`);
  renderAll();
}

function surpriseMe() {
  pushHistory();
  const layout = LAYOUT_ORDER[Math.floor(Math.random() * LAYOUT_ORDER.length)];
  const grade = GRADE_ORDER[Math.floor(Math.random() * GRADE_ORDER.length)];
  const [title, subtitle] = SURPRISE_TITLES[Math.floor(Math.random() * SURPRISE_TITLES.length)];
  const sizes = ['square', 'portrait', 'landscape'];
  state.layout = layout;
  state.grade = grade;
  state.title = title;
  state.subtitle = subtitle;
  state.stars = 4 + Math.floor(Math.random() * 2);
  state.badge = ['EST. 2026', '24 / 7', "SUMMER '26", 'MIDNIGHT'][Math.floor(Math.random() * 4)];
  state.size = sizes[Math.floor(Math.random() * sizes.length)];
  state.selected = 0;
  for (let i = 0; i < 9; i++) state.assign[i] = Math.floor(Math.random() * state.photos.length);
  setStatus(`Surprise: ${LAYOUTS[layout].label} + ${GRADES[grade].label}.`);
  renderAll();
}

function setStatus(text) {
  $('status').textContent = text;
}

function exportCover(sizeKey) {
  const out = document.createElement('canvas');
  const size = { square: { w: 1080, h: 1080 }, portrait: { w: 1080, h: 1350 }, landscape: { w: 1920, h: 1080 } }[sizeKey];
  out.width = size.w;
  out.height = size.h;
  const octx = out.getContext('2d');
  const shot = cloneState(state);
  shot.size = sizeKey;
  drawCover(octx, shot, images, size.w, size.h);
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `palm-city-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved palm-city-${size.w}x${size.h}.png`);
  }, 'image/png');
}

function exportAll() {
  exportCover('square');
  setTimeout(() => exportCover('portrait'), 350);
  setTimeout(() => exportCover('landscape'), 700);
  setStatus('Exporting all three sizes…');
}

function hitPanel(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = ((clientX - rect.left) / rect.width) * canvas.width;
  const py = ((clientY - rect.top) / rect.height) * canvas.height;
  for (let i = lastPanels.length - 1; i >= 0; i--) {
    const p = lastPanels[i];
    if (p.kind !== 'photo') continue;
    const dx = px - (p.x + p.w / 2);
    const dy = py - (p.y + p.h / 2);
    const a = (-p.rot * Math.PI) / 180;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) <= p.w / 2 && Math.abs(ly) <= p.h / 2) return p;
  }
  return null;
}

function bindEditor() {
  for (const key of ['square', 'portrait', 'landscape']) {
    $(`size-${key}`).addEventListener('click', () => {
      if (state.size === key) return;
      pushHistory();
      state.size = key;
      renderAll();
    });
  }
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('surprise').addEventListener('click', surpriseMe);
  $('title').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
  $('badge').addEventListener('input', (e) => { state.badge = e.target.value; renderPreview(); });
  $('title').addEventListener('change', pushHistory);
  $('subtitle').addEventListener('change', pushHistory);
  $('badge').addEventListener('change', pushHistory);
  $('strength').addEventListener('input', (e) => {
    state.gradeStrength = Number(e.target.value) / 100;
    $('strengthVal').textContent = `${e.target.value}%`;
    renderPreview();
  });
  $('strength').addEventListener('change', pushHistory);
  $('grain').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; renderAll(); });
  $('vignette').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; renderAll(); });

  const cropInput = (key) => (e) => {
    const panel = selectedPanel();
    if (!panel) return;
    const crop = state.crops[panel.slot] || { zoom: 1, ox: 0, oy: 0, flip: false };
    crop[key] = Number(e.target.value);
    state.crops[panel.slot] = crop;
    renderPreview();
    renderPanelTools();
  };
  $('zoom').addEventListener('input', cropInput('zoom'));
  $('panX').addEventListener('input', cropInput('ox'));
  $('panY').addEventListener('input', cropInput('oy'));
  $('zoom').addEventListener('change', pushHistory);
  $('panX').addEventListener('change', pushHistory);
  $('panY').addEventListener('change', pushHistory);
  $('flipBtn').addEventListener('click', () => {
    const panel = selectedPanel();
    if (!panel) return;
    pushHistory();
    const crop = state.crops[panel.slot] || { zoom: 1, ox: 0, oy: 0, flip: false };
    crop.flip = !crop.flip;
    state.crops[panel.slot] = crop;
    renderAll();
  });
  $('resetCrop').addEventListener('click', () => {
    const panel = selectedPanel();
    if (!panel) return;
    pushHistory();
    state.crops[panel.slot] = { zoom: 1, ox: 0, oy: 0, flip: false };
    renderAll();
  });

  $('addPhotos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const id = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      try {
        const img = await loadImage(url);
        state.photos.push({ id, src: url, label: file.name.replace(/\.[^.]+$/, '').slice(0, 14) || 'Your photo' });
        images.set(id, img);
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    pushHistory();
    renderAll();
    setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} added — click one to use it.`);
  });

  canvas.addEventListener('click', (e) => {
    const panel = hitPanel(e.clientX, e.clientY);
    if (!panel) return;
    const photos = photoPanels();
    const idx = photos.indexOf(panel);
    if (idx !== state.selected) {
      state.selected = idx;
      renderAll();
    }
  });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/palm-photo');
    if (raw === '') return;
    const panel = hitPanel(e.clientX, e.clientY);
    if (!panel) return;
    pushHistory();
    state.assign[panel.slot] = Number(raw);
    const photos = photoPanels();
    state.selected = photos.indexOf(panel);
    renderAll();
  });

  $('exportSquare').addEventListener('click', () => exportCover('square'));
  $('exportPortrait').addEventListener('click', () => exportCover('portrait'));
  $('exportLandscape').addEventListener('click', () => exportCover('landscape'));
  $('exportAll').addEventListener('click', exportAll);

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });
}

async function start() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  await document.fonts.load('100px Anton');
  await document.fonts.load('40px Pacifico');
  await document.fonts.ready;
  await loadAllPhotos();
  if (shot) {
    await runShot(shot, params, {
      state, images, canvas, ctx, renderPreview, setStatus,
      initEditor() { renderPresets(); bindEditor(); renderAll(); syncHistoryButtons(); },
    });
    return;
  }
  renderPresets();
  bindEditor();
  renderAll();
  syncHistoryButtons();
}

start();
