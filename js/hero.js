/* hero.js — clocks, FPS counter, model loading progress */

const TIME_FMT = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

function updateClocks() {
  const t = (tz) => new Date().toLocaleTimeString('en-GB', { ...TIME_FMT, timeZone: tz });
  document.getElementById('c-sel')?.setAttribute('data-time', t('Asia/Seoul'));
  document.getElementById('c-hcm')?.setAttribute('data-time', t('Asia/Ho_Chi_Minh'));
  document.getElementById('c-la') ?.setAttribute('data-time', t('America/Los_Angeles'));

  const sel = document.getElementById('c-sel');
  const hcm = document.getElementById('c-hcm');
  const la  = document.getElementById('c-la');
  if (sel) sel.textContent = t('Asia/Seoul');
  if (hcm) hcm.textContent = t('Asia/Ho_Chi_Minh');
  if (la)  la.textContent  = t('America/Los_Angeles');

  const clock = document.getElementById('navClock');
  if (clock) clock.textContent = t('Asia/Ho_Chi_Minh') + ' HCM';
}

function initFPS() {
  let last = performance.now(), frames = 0;
  const el = document.getElementById('fpsCount');
  if (!el) return;
  function count() {
    frames++;
    const now = performance.now();
    if (now - last >= 1000) { el.textContent = frames; frames = 0; last = now; }
    requestAnimationFrame(count);
  }
  requestAnimationFrame(count);
}

const SCAN_SEEN_KEY = 'by_scan_seen';
const SCAN_CAP_MS = 2200;

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initModelLoader() {
  const mv = document.getElementById('gelora');
  const ml = document.getElementById('modelLoader');
  const mp = document.getElementById('loaderPct');
  if (!mv || !ml) return;

  const hasSeenScan = prefersReducedMotion() || localStorage.getItem(SCAN_SEEN_KEY) === '1';

  const hideLoader = () => {
    ml.classList.add('hidden');
    setTimeout(() => { ml.style.display = 'none'; }, 800);
    localStorage.setItem(SCAN_SEEN_KEY, '1');
  };

  if (hasSeenScan) {
    ml.style.transition = 'none';
    hideLoader();
    if (prefersReducedMotion()) mv.removeAttribute('auto-rotate');
    return;
  }

  mv.addEventListener('progress', (e) => {
    if (mp) mp.textContent = Math.round(e.detail.totalProgress * 100) + '%';
  });
  mv.addEventListener('load', hideLoader);

  const capTimer = setTimeout(hideLoader, SCAN_CAP_MS);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { clearTimeout(capTimer); hideLoader(); }
  }, { once: true });
}

export function initHero() {
  updateClocks();
  setInterval(updateClocks, 1000);
  initFPS();
  initModelLoader();
}
