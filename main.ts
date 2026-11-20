// Palm City Poster Lab — the hand-in program for make.fun's
// "Make GTA 6 Cover Art" bounty (gta6-cover-art-01).
//
// The entry is a plain static web app in this folder's app/ directory: an
// offline cover-art maker (index.html plus its own scripts, styles, fonts
// and sample photos) that turns photos and a caption into a multi-panel
// poster-style cover and exports it as a PNG in 1080 x 1080, 1080 x 1350
// or 1920 x 1080. This program copies app/ and screenshots/ beside it
// into the output directory and writes /output/dossier.json, the summary
// the judge reads, using the vendored make.fun library.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and try the app itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, as the starter documents them: the text budget shapes
// the dossier's bytes, while the other caps refuse an entry the scorer
// would refuse (more than 4 screenshots, one over 256 KiB, more than 993
// files or 48 MiB under app/, or an app/ path over 1000 bytes — app/
// shares /output's own 1000-entry cap with screenshots/ and dossier.json).
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// Say what was handed in, so a local run shows the same shape the grader sees.
console.log(`Palm City Poster Lab handed in: dossier.json is ${statSync(dossierPath).size} bytes.`);
