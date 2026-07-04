/* nav.js — navigation, scroll behaviour, mobile menu */

export function goTo(id) {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

export function toggleMob() {
  document.getElementById('mobMenu').classList.toggle('open');
  document.getElementById('hamBtn').classList.toggle('open');
}

export function closeMob() {
  document.getElementById('mobMenu').classList.remove('open');
  document.getElementById('hamBtn').classList.remove('open');
}

export function initNav() {
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('scrolled', scrollY > 50);
  }, { passive: true });

  // Expose helpers globally so inline onclick attributes work
  window.goTo      = goTo;
  window.toggleMob = toggleMob;
  window.closeMob  = closeMob;
}
