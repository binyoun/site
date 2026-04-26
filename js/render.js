/**
 * render.js — fetches data/*.json and populates the island panels.
 * To update content: edit the JSON files in data/ (or in Obsidian),
 * then push to GitHub. No HTML or JS changes needed.
 */

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

// ── Artist ───────────────────────────────────────────────────────────────────

function buildThumbs(works, squareImg = false) {
  return works.map(w => `
    <div class="th">
      <div class="th-img${squareImg ? ' th-img-sq' : ''}">
        <img src="${w.image}" alt="${w.title}" loading="lazy">
      </div>
      <div class="th-info">
        <p class="th-t">${w.title}</p>
        <p class="th-y">${w.year}</p>
        ${w.medium ? `<p class="th-m">${w.medium}</p>` : ''}
        ${w.link   ? `<a href="${w.link}" target="_blank" rel="noopener" class="th-lk">View &#x2197;</a>` : ''}
      </div>
    </div>`).join('');
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
  const data = await fetch('data/artist.json').then(r => r.json());

  set('a-current', buildThumbs(data.current));
  set('a-install', buildThumbs(data.installations));
  set('a-sculpt',  buildThumbs(data.sculptures, true));
  set('a-lens',    buildThumbs(data.lens));

  const poemEl = document.getElementById('a-poem');
  if (poemEl) poemEl.textContent = data.poem;

  const exhEl = document.getElementById('exhAcc');
  if (exhEl) exhEl.innerHTML =
    buildAccordion('Solo Exhibitions (2017 — 2023)', data.exhibitions.solo) +
    buildAccordion('Group Exhibitions (2012 — 2024)', data.exhibitions.group);
}

// ── Educator ─────────────────────────────────────────────────────────────────

async function renderEducator() {
  const data = await fetch('data/educator.json').then(r => r.json());

  const roleEl = document.getElementById('edu-role');
  if (roleEl) roleEl.innerHTML = `
    <p style="font-family:var(--heading);font-size:16px;color:var(--ink);">${data.role.title}</p>
    <p style="font-size:13px;color:var(--ink45);">${data.role.institution}</p>
    <p style="font-size:12px;color:var(--ink30);margin-top:3px;">${data.role.department} · ${data.role.period}</p>`;

  const workshopEl = document.getElementById('edu-workshops');
  if (workshopEl) workshopEl.innerHTML = data.workshops.map(w => `
    <div class="edu-c">
      <h3>${w.title}</h3>
      ${w.subtitle ? `<p class="em">${w.subtitle}</p>` : ''}
      <p>${w.description}</p>
      ${w.links.length ? `<div class="edu-lks">${w.links.map(l =>
        `<a href="${l.url}" target="_blank" rel="noopener" class="bio-lk">${l.label} &#x2197;</a>`
      ).join('')}</div>` : ''}
    </div>`).join('');

  const guestEl = document.getElementById('edu-guests');
  if (guestEl) guestEl.textContent = data.guests.join(' · ');
}

// ── Researcher ───────────────────────────────────────────────────────────────

async function renderResearcher() {
  const data = await fetch('data/researcher.json').then(r => r.json());

  const initEl = document.getElementById('res-initiatives');
  if (initEl) initEl.innerHTML = data.initiatives.map(i => `
    <div class="res-c">
      <p class="res-c-title">${i.title}</p>
      <p class="res-c-body">${i.description}</p>
      <p class="res-c-meta">${i.location}</p>
      ${i.link ? `<a href="${i.link}" target="_blank" rel="noopener" class="res-lk">Visit &#x2197;</a>` : ''}
    </div>`).join('');

  const commEl = document.getElementById('res-committee');
  if (commEl) commEl.innerHTML = data.committee.map(c => `
    <div class="res-c">
      <p class="res-c-title">${c.role}</p>
      <p class="res-c-body">${c.event}</p>
      <p class="res-c-meta">${c.location}</p>
      ${c.link ? `<a href="${c.link}" target="_blank" rel="noopener" class="res-lk">Visit &#x2197;</a>` : ''}
    </div>`).join('');

  const pubEl = document.getElementById('res-publications');
  if (pubEl) {
    const years = [...new Set(data.publications.map(p => p.year))].sort((a, b) => b - a);
    pubEl.innerHTML = years.map(year => `
      <div class="res-year">
        <div class="res-year-h">${year}</div>
        ${data.publications.filter(p => p.year === year).map(p => `
          <div class="res-pub">
            <h4>${p.title}</h4>
            <p class="res-venue">${p.venue}</p>
            ${p.coauthors ? `<p class="res-coauth">${p.coauthors}</p>` : ''}
            ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener" class="res-lk">View &#x2197;</a>` : ''}
          </div>`).join('')}
      </div>`).join('');
  }

  const talkEl = document.getElementById('res-talks');
  if (talkEl) talkEl.innerHTML = data.talks.map(t => `
    <div class="res-c">
      <p class="res-c-meta">${t.venue}</p>
      <p class="res-c-title" style="font-style:italic;">${t.title}</p>
      ${t.link ? `<a href="${t.link}" target="_blank" rel="noopener" class="res-lk">Read &#x2197;</a>` : ''}
    </div>`).join('');

  const deckEl = document.getElementById('res-decks');
  if (deckEl) deckEl.innerHTML = `<div style="display:flex;gap:10px;">${
    data.decks.map(d => `<a href="${d.url}" target="_blank" rel="noopener" class="res-btn">${d.label}</a>`).join('')
  }</div>`;
}

// ── Bio ───────────────────────────────────────────────────────────────────────

async function renderBio() {
  const data = await fetch('data/bio.json').then(r => r.json());

  const bioTextEl = document.getElementById('bio-text');
  if (bioTextEl) bioTextEl.innerHTML = data.paragraphs.map(p => `<p>${p}</p>`).join('');

  const eduEl = document.getElementById('bio-education');
  if (eduEl) eduEl.innerHTML = `<p>${data.education}</p>`;

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
}

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initRender() {
  await Promise.all([renderArtist(), renderEducator(), renderResearcher(), renderBio()]);
}
