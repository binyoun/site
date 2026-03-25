/* ui.js — island open/close, scroll reveal, card ripple */

export function openIsland(name) {
  const el = document.getElementById('island-' + name);
  if (!el) return;
  el.classList.add('open');
  el.scrollTop = 0;
  document.body.classList.add('no-scroll');
}

export function closeIsland(name) {
  document.getElementById('island-' + name)?.classList.remove('open');
  document.body.classList.remove('no-scroll');
}

export function initUI() {
  // Expose island controls globally for inline onclick handlers
  window.openIsland  = openIsland;
  window.closeIsland = closeIsland;

  // ESC closes any open island
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.island.open').forEach(el => el.classList.remove('open'));
    document.body.classList.remove('no-scroll');
  });

  // Scroll reveal
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('vis'); obs.unobserve(entry.target); }
    });
  }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.rv').forEach(el => obs.observe(el));

  // Card hover ripple
  document.querySelectorAll('.ripple-card').forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const wave = document.createElement('div');
      wave.classList.add('ripple-wave');
      let color = 'rgba(255,45,155,0.1)';
      if (card.classList.contains('portal-educator')) color = 'rgba(79,255,223,0.1)';
      if (card.classList.contains('portal-researcher')) color = 'rgba(57,255,20,0.1)';
      const s = Math.max(rect.width, rect.height) * 2;
      wave.style.cssText = `width:${s}px;height:${s}px;left:${x - s/2}px;top:${y - s/2}px;background:radial-gradient(circle,${color} 0%,transparent 70%)`;
      card.appendChild(wave);
      requestAnimationFrame(() => wave.classList.add('animate'));
      wave.addEventListener('animationend', () => wave.remove());
    });
  });
}

// Accordion toggle — called from render.js-generated HTML
window.toggleAcc = function(btn) {
  btn.classList.toggle('open');
  btn.nextElementSibling.classList.toggle('open');
};
