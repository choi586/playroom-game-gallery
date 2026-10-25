'use strict';
const $ = id => document.getElementById(id);
let games = [];
const fallback = 'assets/placeholder.svg';
const announce = message => { $('status').textContent = message; };
function webUrl(value) {
  if (typeof value !== 'string') return false;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}
function validImage(value) {
  return typeof value === 'string' && (value === '' || /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value) || webUrl(value) || /^assets\/[\w./-]+$/.test(value) && !value.includes('..'));
}
function validate(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.games) || data.games.length > 300) throw Error('version: 1, games 배열 형식의 JSON이어야 합니다. 최대 300개입니다.');
  const ids = new Set();
  return data.games.map(g => {
    if (!g || typeof g.id !== 'string' || !g.id || ids.has(g.id) || typeof g.name !== 'string' || !g.name.trim() || g.name.length > 100 || !webUrl(g.url) || !validImage(g.thumbnail) || g.thumbnail.length > 4500000) throw Error('중복 ID 또는 올바르지 않은 이름, 링크, 썸네일이 있습니다.');
    ids.add(g.id); return { id:g.id, name:g.name.trim(), url:g.url, thumbnail:g.thumbnail };
  });
}
function render() {
  $('grid').replaceChildren();
  const filtered = games.filter(g => g.name.toLocaleLowerCase().includes($('search').value.trim().toLocaleLowerCase()));
  $('count').textContent = filtered.length;
  $('empty').hidden = filtered.length > 0;
  for (const g of filtered) {
    const card = document.createElement('article'); card.className = 'card';
    const a = document.createElement('a'); a.className = 'game-link'; a.href = g.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', `${g.name} — 새 탭에서 게임 열기`);
    const img = document.createElement('img'); img.className = 'thumb'; img.src = g.thumbnail || fallback; img.alt = ''; img.loading = 'lazy'; img.onerror = () => { img.onerror = null; img.src = fallback; };
    const body = document.createElement('div'); body.className = 'card-body';
    const titleWrap = document.createElement('div'); const title = document.createElement('h3'); title.textContent = g.name;
    const sub = document.createElement('small'); sub.textContent = 'WEB GAME · 새 탭에서 열기'; titleWrap.append(title, sub);
    const arrow = document.createElement('span'); arrow.className = 'launch'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true'); body.append(titleWrap, arrow); a.append(img, body); card.append(a);
    $('grid').append(card);
  }
}
$('search').oninput = render;
(async () => {
  try {
    const response = await fetch('games.json', {cache:'no-store'});
    if (!response.ok) throw Error('목록을 읽지 못했습니다.');
    games = validate(await response.json());
    render();
  } catch {
    $('empty').hidden = true;
    announce('게임 목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.');
  }
})();
