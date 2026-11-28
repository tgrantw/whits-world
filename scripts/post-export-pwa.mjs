import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');
const SW_PATH = path.join(DIST_DIR, 'sw.js');

if (!fs.existsSync(INDEX_PATH)) {
  console.error('dist/index.html not found. Run `expo export --platform web` first.');
  process.exit(1);
}

// 1. Collect every static file inside dist/ for offline precaching
function walkFiles(dir, base = dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, base));
    } else {
      const rel = './' + path.relative(base, full).replace(/\\/g, '/');
      if (rel !== './sw.js' && rel !== './metadata.json') {
        results.push(rel);
      }
    }
  }
  return results;
}

const precacheFiles = ['./', ...walkFiles(DIST_DIR)].filter(
  (v, idx, arr) => arr.indexOf(v) === idx
);

const isCriticalBootAsset = (rel) =>
  rel === './' ||
  rel === './index.html' ||
  rel === './manifest.json' ||
  rel === './favicon.ico' ||
  rel.startsWith('./_expo/static/js/') ||
  rel.includes('/bg-home.') ||
  rel.includes('/whit-') ||
  rel === './audio/voice-core.mp3' ||
  rel === './icons/apple-touch-icon.png' ||
  rel === './icons/icon-192.png';

const criticalUrls = precacheFiles.filter(isCriticalBootAsset);
const deferredUrls = precacheFiles.filter((u) => !isCriticalBootAsset(u));

// Derive a deterministic build version hash from index.html + file list
const indexRaw = fs.readFileSync(INDEX_PATH, 'utf8');
const versionHash = crypto
  .createHash('sha256')
  .update(indexRaw + precacheFiles.join('|'))
  .digest('hex')
  .slice(0, 10);
const CACHE_NAME = `whits-world-${versionHash}`;

// 2. Patch dist/index.html for full-screen Android/iPad PWA install, toddler touch lock & auto-updates
let html = indexRaw;

// Lock pinch-zoom and cover notch/status bar cleanly on Lenovo & iPad tablets
html = html.replace(
  /<meta name="viewport"[^>]*>/i,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
);

// Prevent accidental pull-to-refresh, double-tap zoom, and long-press text selection for toddlers
const toddlerCss = `
      html, body {
        overscroll-behavior: none;
        touch-action: manipulation;
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
        background-color: #EBF8E5;
      }
      * {
        -webkit-tap-highlight-color: transparent;
      }
`;
if (!html.includes('overscroll-behavior: none')) {
  html = html.replace('</style>', `${toddlerCss}    </style>`);
}

// Inject PWA manifest + Android/iPad full-screen meta tags + icons
const pwaHeadTags = `
    <link rel="manifest" href="./manifest.json" />
    <meta name="application-name" content="Whit's World" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Whit's World" />
    <link rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png" />
`;
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${pwaHeadTags}  </head>`);
}

// Register auto-updating Service Worker & trigger calm deferred warmup once Home finishes loading
const swRegisterScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker
            .register('./sw.js', { updateViaCache: 'none' })
            .then(function (reg) {
              setTimeout(function () {
                var worker = reg.active || reg.waiting || reg.installing;
                if (worker) {
                  worker.postMessage({ type: 'WARMUP_ZOO_ASSETS' });
                }
              }, 1200);

              // Check for latest Whit's World update whenever tablet returns to the app
              document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') {
                  reg.update().catch(function () {});
                }
              });
            })
            .catch(function () {});

          // Smoothly switch to new version once downloaded in background
          var reloading = false;
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (!reloading) {
              reloading = true;
              window.location.reload();
            }
          });
        });
      }
    </script>
`;
if (!html.includes('serviceWorker')) {
  html = html.replace('</body>', `${swRegisterScript}  </body>`);
}

fs.writeFileSync(INDEX_PATH, html, 'utf8');

// 3. Write self-updating 2-stage offline-first Service Worker (dist/sw.js)
const swSource = `/* Auto-generated by scripts/post-export-pwa.mjs — Version ${versionHash} */
const CACHE_NAME = ${JSON.stringify(CACHE_NAME)};
const CRITICAL_BOOT_URLS = ${JSON.stringify(criticalUrls, null, 2)};
const DEFERRED_WARMUP_URLS = ${JSON.stringify(deferredUrls, null, 2)};

let warmupInFlight = null;

async function warmDeferredAssets() {
  if (warmupInFlight) return warmupInFlight;
  warmupInFlight = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const batchSize = 3;
    for (let i = 0; i < DEFERRED_WARMUP_URLS.length; i += batchSize) {
      const slice = DEFERRED_WARMUP_URLS.slice(i, i + batchSize);
      await Promise.allSettled(
        slice.map(async (url) => {
          const existing = await cache.match(url);
          if (!existing) {
            await cache.add(new Request(url, { cache: 'reload' })).catch(() => null);
          }
        })
      );
    }
  })().finally(() => {
    warmupInFlight = null;
  });
  return warmupInFlight;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        CRITICAL_BOOT_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('whits-world-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WARMUP_ZOO_ASSETS') {
    event.waitUntil(warmDeferredAssets());
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests (index.html): Network-first so updates arrive immediately when online,
  // with instant offline fallback from cache for car rides / flights!
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html') || caches.match('./')))
    );
    return;
  }

  // Static bundled assets (content-hashed JS, optimized PNGs & neural voice MP3s): Cache-first, network fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
`;

fs.writeFileSync(SW_PATH, swSource, 'utf8');
console.log(
  `[PWA] Built ${CACHE_NAME}: ${criticalUrls.length} critical boot files + ${deferredUrls.length} staged warmup files!`
);

