// Palm City Poster Lab — state, layouts, grades and presets.
// Everything the cover renderer needs lives here as plain data, so the
// editor (main.js) and the renderer (cover.js) never disagree about a name.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  landscape: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const PHOTOS = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard', focus: { fx: 0.5, fy: 0.22 } },
  { id: 'pier', src: 'samples/pier.jpg', label: 'Pier', focus: { fx: 0.45, fy: 0.3 } },
  { id: 'neon-street', src: 'samples/neon-street.jpg', label: 'Neon Street', focus: { fx: 0.55, fy: 0.35 } },
  { id: 'beach-bar', src: 'samples/beach-bar.jpg', label: 'Beach Bar', focus: { fx: 0.5, fy: 0.42 } },
];

// A layout is a function of the photo area (x, y, w, h, gap) returning the
// panels that fill it. Each panel: {x, y, w, h, rot, kind, slot} where kind
// is 'photo' or one of the graphic kinds, and slot picks the panel's photo
// and crop from the state (slot numbers are stable per layout position).
export const LAYOUTS = {
  nine: {
    label: 'Nine Panel Grid',
    panels(ax, ay, aw, ah, g) {
      const cw = (aw - 2 * g) / 3;
      const ch = (ah - 2 * g) / 3;
      const kinds = ['photo', 'sun', 'photo', 'palms', 'photo', 'halftone', 'photo', 'stripes', 'photo'];
      const out = [];
      for (let i = 0; i < 9; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        out.push({
          x: ax + col * (cw + g), y: ay + row * (ch + g), w: cw, h: ch, rot: 0,
          kind: kinds[i], slot: i,
        });
      }
      return out;
    },
  },
  heroThree: {
    label: 'Hero + Three',
    panels(ax, ay, aw, ah, g) {
      const heroW = aw * 0.62;
      const sideX = ax + heroW + g;
      const sideW = aw - heroW - g;
      const sh = (ah - 2 * g) / 3;
      return [
        { x: ax, y: ay, w: heroW, h: ah, rot: 0, kind: 'photo', slot: 0 },
        { x: sideX, y: ay, w: sideW, h: sh, rot: 0, kind: 'photo', slot: 1 },
        { x: sideX, y: ay + sh + g, w: sideW, h: sh, rot: 0, kind: 'photo', slot: 2 },
        { x: sideX, y: ay + 2 * (sh + g), w: sideW, h: sh, rot: 0, kind: 'photo', slot: 3 },
      ];
    },
  },
  tilted: {
    label: 'Tilted Snapshots',
    panels(ax, ay, aw, ah, g) {
      const cw = (aw - g) / 2;
      const ch = (ah - g) / 2;
      return [
        { x: ax, y: ay, w: cw, h: ch, rot: -2.5, kind: 'photo', slot: 0 },
        { x: ax + cw + g, y: ay, w: cw, h: ch, rot: 2, kind: 'photo', slot: 1 },
        { x: ax, y: ay + ch + g, w: cw, h: ch, rot: 1.5, kind: 'photo', slot: 2 },
        { x: ax + cw + g, y: ay + ch + g, w: cw, h: ch, rot: -2, kind: 'photo', slot: 3 },
      ];
    },
  },
  fullBleed: {
    label: 'Full Bleed + Stills',
    panels(ax, ay, aw, ah, g) {
      const stillH = ah * 0.3;
      const stillW = (aw - 2 * g) / 3;
      const sy = ay + ah - stillH;
      return [
        { x: ax, y: ay, w: aw, h: ah, rot: 0, kind: 'photo', slot: 0 },
        { x: ax, y: sy, w: stillW, h: stillH, rot: -1.5, kind: 'photo', slot: 1 },
        { x: ax + stillW + g, y: sy, w: stillW, h: stillH, rot: 1, kind: 'photo', slot: 2 },
        { x: ax + 2 * (stillW + g), y: sy, w: stillW, h: stillH, rot: -1, kind: 'photo', slot: 3 },
      ];
    },
  },
  triptych: {
    label: 'Triptych',
    panels(ax, ay, aw, ah, g) {
      const cw = (aw - 2 * g) / 3;
      return [0, 1, 2].map((i) => ({
        x: ax + i * (cw + g), y: ay, w: cw, h: ah, rot: 0, kind: 'photo', slot: i,
      }));
    },
  },
  diagonal: {
    label: 'Diagonal Split',
    panels(ax, ay, aw, ah, g) {
      const topH = ah * 0.58;
      const botY = ay + topH + g;
      const botH = ah - topH - g;
      const bw = (aw - g) / 2;
      return [
        { x: ax, y: ay, w: aw, h: topH, rot: 0, kind: 'photo', slot: 0, diag: 'down' },
        { x: ax, y: botY, w: bw, h: botH, rot: 0, kind: 'photo', slot: 1 },
        { x: ax + bw + g, y: botY, w: bw, h: botH, rot: 0, kind: 'photo', slot: 2 },
      ];
    },
  },
  story: {
    label: 'Story Stack',
    panels(ax, ay, aw, ah, g) {
      const heroH = ah * 0.56;
      const botY = ay + heroH + g;
      const botH = ah - heroH - g;
      const bw = (aw - g) / 2;
      return [
        { x: ax, y: ay, w: aw, h: heroH, rot: 0, kind: 'photo', slot: 0 },
        { x: ax, y: botY, w: bw, h: botH, rot: 0, kind: 'photo', slot: 1 },
        { x: ax + bw + g, y: botY, w: bw, h: botH, rot: 0, kind: 'photo', slot: 2 },
      ];
    },
  },
  filmstrip: {
    label: 'Filmstrip',
    panels(ax, ay, aw, ah, g) {
      const stripH = ah * 0.3;
      const heroH = ah - stripH - g;
      const fw = (aw - 3 * g) / 4;
      const sy = ay + heroH + g;
      const out = [{ x: ax, y: ay, w: aw, h: heroH, rot: 0, kind: 'photo', slot: 0 }];
      for (let i = 0; i < 4; i++) {
        out.push({
          x: ax + i * (fw + g), y: sy, w: fw, h: stripH, rot: 0,
          kind: i === 2 ? 'sun' : 'photo', slot: i + 1,
        });
      }
      return out;
    },
  },
};

export const LAYOUT_ORDER = ['nine', 'heroThree', 'tilted', 'fullBleed', 'triptych', 'diagonal', 'story', 'filmstrip'];

// A grade colours the whole poster: the sky behind the panels, the wash
// over every photo, the title gradient, the accent and the band.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset', sky: ['#ff9a3d', '#ff5e7a', '#7a2d8f'], wash: '#ff7a3d',
    title: ['#ffe259', '#ffa751'], stroke: '#3d0a2e', accent: '#ff5e7a',
    sub: '#7df9ff', band: '#160a24', bandLine: '#ff5e7a',
  },
  neon: {
    label: 'Neon Night', sky: ['#1b0f4b', '#a4138f', '#0d0221'], wash: '#b5179e',
    title: ['#f0abfc', '#22d3ee'], stroke: '#0d0221', accent: '#22d3ee',
    sub: '#f0abfc', band: '#0d0221', bandLine: '#22d3ee',
  },
  gold: {
    label: 'Palm Gold', sky: ['#ffd76a', '#ff9e4f', '#b3541e'], wash: '#ffb347',
    title: ['#fff3b0', '#ff9e00'], stroke: '#3a1c00', accent: '#ff9e00',
    sub: '#7df9ff', band: '#1c0f02', bandLine: '#ffb347',
  },
  magenta: {
    label: 'Magenta Rush', sky: ['#ff4d8d', '#c9184a', '#3a0ca3'], wash: '#ff4d8d',
    title: ['#ff8fab', '#ffc2d1'], stroke: '#2b0a3d', accent: '#ff4d8d',
    sub: '#ffe259', band: '#1d0626', bandLine: '#ff4d8d',
  },
  teal: {
    label: 'Teal Dusk', sky: ['#7df9ff', '#2a9d8f', '#0b3d5c'], wash: '#2ec4b6',
    title: ['#caffbf', '#2ec4b6'], stroke: '#062a33', accent: '#2ec4b6',
    sub: '#ffd76a', band: '#04141d', bandLine: '#2ec4b6',
  },
  noir: {
    label: 'Mono Noir', sky: ['#e8e8e8', '#8a8a8a', '#111111'], wash: '#888888',
    title: ['#ffffff', '#c9c9c9'], stroke: '#000000', accent: '#ffffff',
    sub: '#d9d9d9', band: '#0a0a0a', bandLine: '#ffffff',
  },
  coral: {
    label: 'Coral Dawn', sky: ['#ffd6c2', '#ff8a7a', '#8f2d56'], wash: '#ff8a7a',
    title: ['#fff1e6', '#ff6b6b'], stroke: '#4a0e2e', accent: '#ff6b6b',
    sub: '#7df9ff', band: '#20060f', bandLine: '#ff8a7a',
  },
  ultraviolet: {
    label: 'Ultraviolet', sky: ['#c77dff', '#7b2cbf', '#10002b'], wash: '#9d4edd',
    title: ['#e0aaff', '#5a189a'], stroke: '#10002b', accent: '#c77dff',
    sub: '#80ffdb', band: '#10002b', bandLine: '#c77dff',
  },
};

export const GRADE_ORDER = ['sunset', 'neon', 'gold', 'magenta', 'teal', 'noir', 'coral', 'ultraviolet'];

// One-click looks: layout + grade + words + size, all at once.
export const PRESETS = {
  goldenHour: {
    label: 'Golden Hour', size: 'landscape', layout: 'heroThree', grade: 'sunset',
    title: 'GOLDEN HOUR', subtitle: 'chasing the last light', stars: 5, badge: 'EST. 2026',
  },
  neonNights: {
    label: 'Neon Nights', size: 'portrait', layout: 'tilted', grade: 'neon',
    title: 'VICE NIGHTS', subtitle: 'the city never sleeps', stars: 4, badge: '24 / 7',
  },
  palmGoldRush: {
    label: 'Palm Gold Rush', size: 'square', layout: 'nine', grade: 'gold',
    title: 'PALM & NEON', subtitle: 'summer in the city', stars: 5, badge: "SUMMER '26",
  },
  noirDrive: {
    label: 'Noir Drive', size: 'landscape', layout: 'fullBleed', grade: 'noir',
    title: 'NOIR DRIVE', subtitle: 'midnight run', stars: 4, badge: 'MIDNIGHT',
  },
};

export const PRESET_ORDER = ['goldenHour', 'neonNights', 'palmGoldRush', 'noirDrive'];

export const SURPRISE_TITLES = [
  ['PALM CITY', 'where the sun never sets'],
  ['OCEAN DRIVE', 'neon on the water'],
  ['SUNSET STRIP', 'every light is on'],
  ['VICE HEAT', 'too hot to slow down'],
  ['BOARDWALK', 'salt air and static'],
  ['MIDNIGHT PALMS', 'the night belongs to us'],
];

function freshCrops() {
  const crops = {};
  for (let i = 0; i < 9; i++) {
    // Each slot starts with its own crop so the same photo never repeats
    // the same framing twice on one cover. Slot 8 is mirrored as well:
    // the nine-panel grid shows the pier photo in slots 4 and 8, and a
    // flip is the only change that reads as a different shot at a glance.
    crops[i] = { zoom: 1 + (i % 3) * 0.12, ox: (i % 2 === 0 ? -0.06 : 0.06), oy: (i % 3) * 0.04 - 0.04, flip: i === 8 };
  }
  return crops;
}

// The four photos are dealt to the slots in this order, so no face shows
// up more than twice on any cover, whatever the layout.
const ASSIGN_ORDER = [0, 1, 2, 3, 1, 2, 3, 0, 1];

function freshAssign() {
  const assign = {};
  for (let i = 0; i < 9; i++) assign[i] = ASSIGN_ORDER[i];
  return assign;
}

export function defaultState() {
  return {
    size: 'landscape',
    layout: 'heroThree',
    grade: 'sunset',
    gradeStrength: 0.85,
    grain: true,
    vignette: true,
    title: 'GOLDEN HOUR',
    subtitle: 'chasing the last light',
    stars: 5,
    badge: 'EST. 2026',
    photos: PHOTOS.map((p) => ({ ...p })),
    assign: freshAssign(),
    crops: freshCrops(),
    selected: 0,
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
