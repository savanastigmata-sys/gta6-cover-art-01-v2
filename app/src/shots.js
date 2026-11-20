// Palm City Poster Lab — fixed scenes for screenshots.
// `?shot=cover` renders the landscape export alone, `?shot=portrait` the
// portrait export, `?shot=square` the square export, and `?shot=editor`
// the full editor with a photo loaded and a frame selected.
// window.__shotReady is set once the scene is painted, so a screenshot
// tool can wait for it instead of guessing.

import { drawCover } from './cover.js';
import { PRESETS } from './state.js';

function applyPreset(state, key) {
  const p = PRESETS[key];
  state.size = p.size;
  state.layout = p.layout;
  state.grade = p.grade;
  state.title = p.title;
  state.subtitle = p.subtitle;
  state.stars = p.stars;
  state.badge = p.badge;
  state.selected = 0;
}

function paint(api, w, h) {
  const { canvas, ctx, state, images } = api;
  canvas.width = w;
  canvas.height = h;
  drawCover(ctx, state, images, w, h);
}

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

export async function runShot(shot, params, api) {
  const { state } = api;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    applyPreset(state, 'goldenHour');
    paint(api, 1920, 1080);
    markReady();
    return;
  }
  if (shot === 'portrait') {
    document.body.classList.add('shot-cover');
    applyPreset(state, 'neonNights');
    paint(api, 1080, 1350);
    markReady();
    return;
  }
  if (shot === 'square') {
    document.body.classList.add('shot-cover');
    applyPreset(state, 'palmGoldRush');
    paint(api, 1080, 1080);
    markReady();
    return;
  }
  // Editor scene: the whole app, landscape cover, first frame selected.
  applyPreset(state, 'goldenHour');
  state.selected = 0;
  api.initEditor();
  api.renderPreview();
  markReady();
}
