/* ui.js — scroll reveal, card ripple, artist filter toggles */

// Filter the Artist works grid by category, keeping state shareable via URL hash.
// Called from render.js once the work cards exist in the DOM.
export function initArtistFilters() {
  const bar = document.getElementById('filterBar');
  if (!bar) return;

  const applyFilter = (filter) => {
    document.querySelectorAll('.th').forEach(card => {
      const cats = (card.dataset.cat || '').split(' ');
      if (filter === 'all' || cats.includes(filter)) card.removeAttribute('data-filter-hide');
      else card.setAttribute('data-filter-hide', '');
    });

    document.querySelectorAll('[data-filter-sec]').forEach(sec => {
      const onlyFilter = sec.dataset.filterOnly;
      if (onlyFilter) {
        if (filter === 'all' || filter === onlyFilter) sec.removeAttribute('data-filter-hide');
        else sec.setAttribute('data-filter-hide', '');
        return;
      }
      const visibleCards = sec.querySelectorAll('.th:not([data-filter-hide])');
      if (filter === 'all' || visibleCards.length > 0) sec.removeAttribute('data-filter-hide');
      else sec.setAttribute('data-filter-hide', '');
    });

    bar.querySelectorAll('.filter-tog').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.filter === filter);
    });
  };

  bar.querySelectorAll('.filter-tog').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const newHash = filter === 'all' ? '' : `#filter=${filter}`;
      history.replaceState(null, '', location.pathname + newHash);
      applyFilter(filter);
    });
  });

  window.addEventListener('hashchange', () => {
    const m = location.hash.match(/filter=([\w-]+)/);
    applyFilter(m ? m[1] : 'all');
  });

  const initialMatch = location.hash.match(/filter=([\w-]+)/);
  applyFilter(initialMatch ? initialMatch[1] : 'all');
}

export function initUI() {
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

  // Fade out the floating work-detail back button once the footer scrolls
  // into view, so it doesn't sit on top of the footer text.
  const backBtn = document.querySelector('.work-back');
  const footerEl = document.querySelector('footer');
  if (backBtn && footerEl) {
    const footerObs = new IntersectionObserver(([entry]) => {
      backBtn.classList.toggle('work-back-hide', entry.isIntersecting);
    }, { rootMargin: '0px 0px -10% 0px' });
    footerObs.observe(footerEl);
  }
}

// Accordion toggle — called from render.js-generated HTML
window.toggleAcc = function(btn) {
  btn.classList.toggle('open');
  btn.nextElementSibling.classList.toggle('open');
};

// Poster thumb toggle on researcher cards — called from render.js-generated HTML
window.togglePoster = function(btn) {
  const card = btn.closest('.res-c');
  if (card) card.classList.toggle('poster-open');
};

// Dismiss a thumbnail's gallery pop-out without navigating — called from render.js-generated HTML
window.dismissPop = function(btn, e) {
  e.preventDefault();
  e.stopPropagation();
  const card = btn.closest('.th');
  if (!card) return;
  card.classList.add('th-dismissed');
  card.addEventListener('mouseleave', function reset() {
    card.classList.remove('th-dismissed');
    card.removeEventListener('mouseleave', reset);
  });
};

// Copy a bio block's text to the clipboard — used on /bio/
window.copyBio = function(btn, id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim()).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
  });
};

// Copy a rendered publication citation to the clipboard — used on /researcher/
window.copyCite = function(btn) {
  const text = btn.dataset.cite;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
  });
};
