/**
 * render.js — fetches data/*.json and populates the island panels.
 * To update content: edit the JSON files in data/ (or in Obsidian),
 * then push to GitHub. No HTML or JS changes needed.
 */

import { initArtistFilters } from './ui.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function el(tag, cls, html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function set(id, html) {
  const target = document.getElementById(id);
  if (target) target.innerHTML = html;
}

// Root-absolute paths so pages at any depth (/, /artist/, /educator/...)
// resolve the same data/image files on this root-domain deploy.
function abs(path) {
  return /^(https?:)?\//.test(path) ? path : '/' + path;
}

// ── Artist ───────────────────────────────────────────────────────────────────

function buildThumbs(works, squareImg = false) {
  return works.map(w => {
    const isInternal = w.link && w.link.startsWith('/');
    const tag = w.link ? 'a' : 'div';
    const openAttrs = w.link
      ? isInternal ? `href="${w.link}"` : `href="${w.link}" target="_blank" rel="noopener"`
      : '';
    const linkLabel = w.link
      ? isInternal
        ? `<span class="th-lk">View work &#x2192;</span>`
        : `<span class="th-lk">View &#x2197;</span>`
      : '';
    const still = w.still || w.image;
    const imgTag = w.image
      ? `<img src="${abs(w.image)}" alt="${w.title}" loading="lazy">`
      : `<div class="th-img-ph"><p>Image pending</p></div>`;
    const popImgTag = still
      ? `<img src="${abs(still)}" alt="" loading="lazy">`
      : `<div class="th-img-ph"><p>Image pending</p></div>`;
    return `
    <${tag} class="th" ${openAttrs} data-cat="${w.cat || ''}">
      <div class="th-img${squareImg ? ' th-img-sq' : ''}">
        ${imgTag}
        <div class="th-grad"></div>
        <div class="th-info">
          <p class="th-t">${w.title}</p>
          <p class="th-y">${w.year}</p>
        </div>
      </div>
      <div class="th-pop">
        <button class="th-pop-close" aria-label="Close preview" onclick="dismissPop(this, event)">&times;</button>
        <div class="th-pop-img">${popImgTag}</div>
        <div class="th-pop-panel">
          <p class="th-pop-t">${w.title}</p>
          <p class="th-pop-y">${w.year}</p>
          ${w.medium ? `<p class="th-pop-m">${w.medium}</p>` : ''}
          ${w.link ? `<span class="th-pop-lk">${isInternal ? 'View work &#x2192;' : 'View &#x2197;'}</span>` : ''}
        </div>
      </div>
    </${tag}>`;
  }).join('');
}

function buildAccordion(title, items) {
  const rows = items.map(i =>
    `<div class="acc-it"><p class="acc-it-t">${i.title}</p><p class="acc-it-m">${i.venue}, ${i.year}</p></div>`
  ).join('');
  return `
    <div class="acc">
      <button class="acc-h" onclick="toggleAcc(this)">${title}<span class="acc-arr">&#x25BE;</span></button>
      <div class="acc-bd">${rows}</div>
    </div>`;
}

async function renderArtist() {
  const data = await fetch('/data/artist.json').then(r => r.json());

  set('a-current', buildThumbs(data.current));
  set('a-install', buildThumbs(data.installations));
  set('a-sculpt',  buildThumbs(data.sculptures, true));
  set('a-lens',    buildThumbs(data.lens));

  const poemEl = document.getElementById('a-poem');
  if (poemEl) poemEl.textContent = data.poem;

  const exhEl = document.getElementById('exhAcc');
  if (exhEl) exhEl.innerHTML =
    buildAccordion('Solo Exhibitions (2017–2023)', data.exhibitions.solo) +
    buildAccordion('Group Exhibitions (2012–2024)', data.exhibitions.group);

  initArtistFilters();
}

// ── Educator ─────────────────────────────────────────────────────────────────

async function renderEducator() {
  const data = await fetch('/data/educator.json').then(r => r.json());

  const chips = list => `<div class="chip-row">${list.map(c => `<span class="chip">${c}</span>`).join('')}</div>`;

  const roleEl = document.getElementById('edu-role');
  if (roleEl) roleEl.innerHTML = `
    <div class="edu-c">
      <p class="res-c-title">${data.role.title}</p>
      <p class="res-c-body">${data.role.institution}</p>
      <p class="res-c-meta">${data.role.department} · ${data.role.period}</p>
      <div class="edu-role-cols">
        <div>
          <p class="res-c-meta">Coordinating</p>
          ${chips(data.role.coordinating)}
        </div>
        <div>
          <p class="res-c-meta">Teaching</p>
          ${chips(data.role.teaching)}
        </div>
      </div>
    </div>`;

  const fwEl = document.getElementById('edu-framework');
  if (fwEl) fwEl.innerHTML = `
    <div class="edu-c mod-media">
      <div class="mod-thumb mod-thumb-icon"><img src="/favicon.svg" alt="" loading="lazy"></div>
      <div class="mod-media-bd">
        <p class="res-c-title">${data.framework.title}</p>
        <p class="res-c-body" style="margin-top:5px;">${data.framework.description}</p>
        ${data.framework.series ? `
        <div class="edu-series">
          <p class="res-c-title" style="font-size:15px;">${data.framework.series.title}</p>
          <p class="res-c-meta">${data.framework.series.subtitle}</p>
          <p class="res-c-body" style="margin-top:5px;">${data.framework.series.description}</p>
        </div>` : ''}
        ${data.framework.links.length ? `<div class="edu-lks">${data.framework.links.map(l =>
          `<a href="${l.url}" target="_blank" rel="noopener" class="res-lk">${l.label} &#x2197;</a>`
        ).join('')}</div>` : ''}
      </div>
    </div>`;

  const workshopEl = document.getElementById('edu-workshops');
  if (workshopEl) workshopEl.innerHTML = `<div class="mod-grid">${data.workshops.map(w => `
    <div class="edu-c">
      <p class="res-c-title">${w.title}</p>
      ${w.subtitle ? `<p class="res-c-meta">${w.subtitle}</p>` : ''}
      <p class="res-c-body" style="margin-top:5px;">${w.description}</p>
      ${w.sessions ? `<div class="card-poster-grid">${w.sessions.map(s => `
        <div>
          ${s.poster
            ? `<img class="card-poster" src="${abs(s.poster)}" alt="Poster for ${s.label}" loading="lazy">`
            : `<div class="card-poster-ph"><p>Poster pending</p></div>`}
          <p class="res-c-meta">${s.label}</p>
        </div>`).join('')}</div>` : ''}
      ${w.links.length ? `<div class="edu-lks">${w.links.map(l =>
        `<a href="${l.url}" target="_blank" rel="noopener" class="res-lk">${l.label} &#x2197;</a>`
      ).join('')}</div>` : ''}
    </div>`).join('')}</div>`;

  const ifftiEl = document.getElementById('edu-iffti');
  if (ifftiEl) {
    const pending = data.iffti.students.every(s => s.name === '[Confirm]');
    ifftiEl.innerHTML = `
    <div class="edu-c">
      <p class="res-c-meta">${data.iffti.event}</p>
      <p class="res-c-body" style="margin-top:5px;margin-bottom:14px;">${data.iffti.description}</p>
      ${pending
        ? `<p class="res-c-meta">${data.iffti.students.length} student works &middot; roster to be announced</p>`
        : `<div class="iffti-grid">
        ${data.iffti.students.map(s => `
          <div class="iffti-card">
            <p class="res-c-body">${s.name}</p>
            <p class="res-c-meta" style="margin-top:4px;">${s.work}</p>
          </div>`).join('')}
      </div>`}
    </div>`;
  }

  const sitesEl = document.getElementById('edu-sites');
  if (sitesEl && data.sites) sitesEl.innerHTML = `<div class="mod-grid">${data.sites.map(s => `
    <div class="edu-c mod-media">
      <div class="mod-thumb mod-thumb-icon"><img src="/favicon.svg" alt="" loading="lazy"></div>
      <div class="mod-media-bd">
        <p class="res-c-title">${s.title}</p>
        <p class="res-c-body">${s.description}</p>
        <a href="${s.url}" target="_blank" rel="noopener" class="res-lk">Visit &#x2197;</a>
      </div>
    </div>`).join('')}</div>`;
}

// ── Researcher ───────────────────────────────────────────────────────────────

async function renderResearcher() {
  const data = await fetch('/data/researcher.json').then(r => r.json());

  // Card with an optional small poster thumb beside the text (mod-media),
  // plain card otherwise. `body` is the inner HTML after the thumb.
  const modCard = (image, alt, body) => image ? `
    <div class="res-c mod-media">
      <div class="mod-thumb"><img src="${abs(image)}" alt="${alt}" loading="lazy"></div>
      <div class="mod-media-bd">${body}</div>
    </div>` : `
    <div class="res-c">${body}</div>`;

  const initEl = document.getElementById('res-initiatives');
  if (initEl) initEl.innerHTML = `<div class="mod-grid">${data.initiatives.map(i =>
    modCard(i.image, `Poster for ${i.title}`, `
      <p class="res-c-title">${i.title}</p>
      <p class="res-c-body">${i.description}</p>
      <p class="res-c-meta">${i.location}</p>
      ${i.link ? `<a href="${i.link}" target="_blank" rel="noopener" class="res-lk">Visit &#x2197;</a>` : ''}`)
  ).join('')}</div>`;

  const commEl = document.getElementById('res-committee');
  if (commEl) commEl.innerHTML = `<div class="mini-grid">${data.committee.map(c => `
    <div class="res-mini">
      <p class="res-mini-t">${c.role}</p>
      <p class="res-mini-b">${c.event}</p>
      <p class="res-mini-m">${c.location}</p>
      ${c.link ? `<a href="${c.link}" target="_blank" rel="noopener" class="res-lk">Visit &#x2197;</a>` : ''}
    </div>`).join('')}</div>`;

  const pubEl = document.getElementById('res-publications');
  if (pubEl) {
    const years = [...new Set(data.publications.map(p => p.year))].sort((a, b) => b - a);
    const citeOf = p => {
      const who = p.coauthors ? `Youn, B. ${p.coauthors}` : 'Youn, B.';
      return `${who} (${p.year}) ${p.title}. ${p.venue}.`.replace(/"/g, '&quot;');
    };
    pubEl.innerHTML = years.map(year => `
      <div class="res-year">
        <div class="res-year-h">${year}</div>
        <div class="res-year-bd">
        ${data.publications.filter(p => p.year === year).map(p => `
          <div class="res-pub">
            <h4>${p.title}</h4>
            <p class="res-venue">${p.venue}</p>
            ${p.coauthors ? `<p class="res-coauth">${p.coauthors}</p>` : ''}
            <div class="res-pub-actions">
              <button class="copy-cite" data-cite="${citeOf(p)}" onclick="copyCite(this)">Copy citation</button>
              ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener" class="res-lk">View &#x2197;</a>` : ''}
            </div>
          </div>`).join('')}
        </div>
      </div>`).join('');

    const ld = {
      "@context": "https://schema.org",
      "@graph": data.publications.map(p => ({
        "@type": "ScholarlyArticle",
        "headline": p.title,
        "author": { "@type": "Person", "name": "Bin Youn" },
        "datePublished": p.year,
        "isPartOf": p.venue,
        ...(p.link ? { "url": p.link } : {})
      }))
    };
    const ldEl = document.createElement('script');
    ldEl.type = 'application/ld+json';
    ldEl.textContent = JSON.stringify(ld);
    document.head.appendChild(ldEl);
  }

  const talkEl = document.getElementById('res-talks');
  if (talkEl) talkEl.innerHTML = `<div class="mod-grid">${data.talks.map(t =>
    modCard(t.image, `Poster for ${t.title}`, `
      <p class="res-c-meta">${t.venue}</p>
      <p class="res-c-title" style="font-style:italic;">${t.title}</p>
      ${t.link ? `<a href="${t.link}" target="_blank" rel="noopener" class="res-lk">Read &#x2197;</a>` : ''}`)
  ).join('')}</div>`;

  const deckEl = document.getElementById('res-decks');
  if (deckEl) deckEl.innerHTML = `<div class="edu-lks">${
    data.decks.map(d => `<a href="${d.url}" target="_blank" rel="noopener" class="res-btn">${d.label}</a>`).join('')
  }</div>`;
}

// ── Bio ───────────────────────────────────────────────────────────────────────

async function renderBio() {
  const data = await fetch('/data/bio.json').then(r => r.json());

  const bioTextEl = document.getElementById('bio-text');
  if (bioTextEl) bioTextEl.innerHTML = data.paragraphs.map(p => `<p>${p}</p>`).join('');

  const eduEl = document.getElementById('bio-education');
  if (eduEl) eduEl.innerHTML = data.education.map(e => `
    <div style="margin-bottom:14px;">
      <p style="font-size:16px;color:rgba(232,232,236,.9);font-weight:500;margin-bottom:2px;">${e.degree}</p>
      <p style="font-size:15px;color:rgba(232,232,236,.65);">${e.institution} · ${e.year}</p>
      ${e.note ? `<p style="font-size:13px;color:rgba(232,232,236,.5);margin-top:2px;">${e.note}</p>` : ''}
    </div>`).join('');

  const honorsEl = document.getElementById('bio-honors');
  if (honorsEl) honorsEl.innerHTML = data.honors.map(h =>
    `<div class="bio-item"><p class="bio-item-t">${h.title}</p><p class="bio-item-d">${h.institution}, ${h.year}</p></div>`
  ).join('');

  const pressEl = document.getElementById('bio-press');
  if (pressEl) pressEl.innerHTML = data.press.map(p =>
    `<div class="bio-item"><a href="${p.url}" target="_blank" rel="noopener" class="bio-lk">${p.label}</a></div>`
  ).join('');

  const contactEl = document.getElementById('bio-contact');
  if (contactEl) contactEl.innerHTML = `
    <a href="mailto:${data.contact.email}" class="bio-lk" style="display:inline-flex;margin-bottom:12px;">${data.contact.email}</a><br>
    <a href="${data.contact.rmit}" target="_blank" rel="noopener" class="bio-btn">RMIT Profile</a>`;

  // ── /bio/ page (light background variants) ──────────────────────────────
  const oneLinerEl = document.getElementById('bio-oneliner');
  if (oneLinerEl) oneLinerEl.textContent = data.lengths.oneLiner;

  const shortEl = document.getElementById('bio-short');
  if (shortEl) shortEl.textContent = data.lengths.short;

  const shortCopyEl = document.getElementById('bio-short-copy');
  if (shortCopyEl) shortCopyEl.textContent = data.lengths.short;

  const fullEl = document.getElementById('bio-full');
  if (fullEl) fullEl.innerHTML = data.lengths.full.split('\n\n').map(p => `<p>${p}</p>`).join('');

  const cvEduEl = document.getElementById('cv-education');
  if (cvEduEl) cvEduEl.innerHTML = data.education.map(e => `
    <div class="edu-c">
      <p class="res-c-title">${e.degree}</p>
      <p class="res-c-body">${e.institution} &middot; ${e.year}</p>
      ${e.note ? `<p class="res-c-meta">${e.note}</p>` : ''}
    </div>`).join('');

  const cvHonorsEl = document.getElementById('cv-honors');
  if (cvHonorsEl) cvHonorsEl.innerHTML = data.honors.map(h => `
    <div class="edu-c">
      <p class="res-c-title">${h.title}</p>
      <p class="res-c-body">${h.institution}, ${h.year}</p>
    </div>`).join('');

  const cvPressEl = document.getElementById('cv-press');
  if (cvPressEl) cvPressEl.innerHTML = data.press.map(p =>
    `<div class="edu-c"><a href="${p.url}" target="_blank" rel="noopener" class="res-lk">${p.label} &#x2197;</a></div>`
  ).join('');

  const contactCardEl = document.getElementById('bio-contact-card');
  if (contactCardEl) contactCardEl.innerHTML = `
    <a href="mailto:${data.contact.email}?subject=Hello%20Bin" class="res-lk" style="font-size:15px;">${data.contact.email}</a><br><br>
    <a href="${data.contact.rmit}" target="_blank" rel="noopener" class="res-lk">RMIT Profile &#x2197;</a>`;
}

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initRender() {
  await Promise.all([renderArtist(), renderEducator(), renderResearcher(), renderBio()]);
}
