'use strict';
const $ = id => document.getElementById(id);
const KEY = 'playroom-draft-v1';
let games = [], published = [], admin = false, editing = null, thumbnail = '', imageReady = true, storageAvailable = true;
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
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ version:1, games })); storageAvailable = true; announce('이 브라우저에 임시 저장했습니다. 공개 반영하려면 JSON을 내보내세요.'); }
  catch { storageAvailable = false; announce('브라우저 저장 공간이 부족하거나 차단되었습니다. 지금 JSON을 내보내 백업하세요.'); }
  render();
}
function button(label, action, disabled = false, className = '') {
  const b = document.createElement('button'); b.textContent = label; b.type = 'button'; b.disabled = disabled; b.className = className; b.onclick = action; return b;
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
    if (admin) {
      const actions = document.createElement('div'); actions.className = 'card-actions'; const i = games.indexOf(g);
      actions.append(button('편집', () => openEditor(g)), button('↑ 위로', () => move(i,-1), i === 0), button('↓ 아래로', () => move(i,1), i === games.length-1), button('삭제', () => { if (confirm(`“${g.name}” 게임을 삭제할까요?`)) { games.splice(i,1); save(); } }, false, 'delete'));
      card.append(actions);
    }
    $('grid').append(card);
  }
}
function move(i, delta) { [games[i], games[i+delta]] = [games[i+delta], games[i]]; save(); }
function preview() { $('imagePreview').hidden = !thumbnail; if (thumbnail) $('imagePreview').src = thumbnail; else $('imagePreview').removeAttribute('src'); }
function openEditor(g = null) {
  imageJob++; editing = g ? g.id : null; thumbnail = g ? g.thumbnail : ''; imageReady = true; $('gameForm').reset(); $('gameName').value = g ? g.name : ''; $('gameUrl').value = g ? g.url : ''; $('formError').textContent = ''; $('editorTitle').textContent = g ? '게임 편집' : '게임 추가'; preview(); $('editor').showModal();
}
$('adminToggle').onclick = () => { admin = !admin; $('adminPanel').hidden = !admin; $('adminToggle').setAttribute('aria-pressed', String(admin)); $('adminToggle').textContent = admin ? '✓ 관리 모드 종료' : '⚙ 관리 모드'; render(); };
$('search').oninput = render;
$('addGame').onclick = () => openEditor();
$('closeEditor').onclick = $('cancelEdit').onclick = () => $('editor').close();
let imageJob = 0;
$('removeImage').onclick = () => { imageJob++; thumbnail = ''; imageReady = true; $('gameImage').value = ''; preview(); };
$('gameImage').onchange = async event => {
  const job = ++imageJob, file = event.target.files[0]; if (!file) return;
  imageReady = false; $('formError').textContent = '';
  try {
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 3 * 1024 * 1024) throw Error('3MB 이하의 PNG, JPG, WebP, GIF 파일을 선택하세요.');
    const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(Error('파일을 읽지 못했습니다.')); reader.readAsDataURL(file); });
    await new Promise((resolve,reject) => { const img = new Image(); img.onload = resolve; img.onerror = () => reject(Error('올바른 이미지 파일이 아닙니다.')); img.src = data; });
    if (job !== imageJob) return; thumbnail = data; preview();
  } catch (error) { if (job === imageJob) { $('formError').textContent = error.message; $('gameImage').value = ''; } }
  finally { if (job === imageJob) imageReady = true; }
};
$('gameForm').onsubmit = event => {
  event.preventDefault();
  if (!imageReady) { $('formError').textContent = '이미지를 읽고 있습니다. 잠시 후 저장하세요.'; return; }
  const g = { id:editing || (globalThis.crypto?.randomUUID?.() || `game-${Date.now()}-${Math.random().toString(36).slice(2)}`), name:$('gameName').value.trim(), url:$('gameUrl').value.trim(), thumbnail };
  try { validate({version:1,games:[g]}); if (!editing && games.length >= 300) throw Error('게임은 최대 300개까지 추가할 수 있습니다.'); }
  catch (error) { $('formError').textContent = error.message; return; }
  if (editing) games[games.findIndex(x => x.id === editing)] = g; else games.push(g);
  save(); $('editor').close();
};
$('exportData').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({version:1,games},null,2)], {type:'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 'games.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); announce('games.json을 내보냈습니다. 저장소의 기존 파일을 교체하면 공개 목록에 반영됩니다.');
};
$('importButton').onclick = () => $('importData').click();
$('importData').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try { if (file.size > 30 * 1024 * 1024) throw Error('가져오기는 30MB 이하의 JSON만 지원합니다.'); const imported = validate(JSON.parse(await file.text())); if (confirm(`현재 목록을 가져온 ${imported.length}개의 게임으로 교체할까요?`)) { games = imported; save(); } }
  catch (error) { announce('가져오기 실패: ' + error.message); }
  finally { event.target.value = ''; }
};
$('resetData').onclick = () => { if (confirm('이 브라우저의 편집 내용을 버리고 공개 목록으로 되돌릴까요? 내보내지 않은 변경은 사라집니다.')) { games = structuredClone(published); try { localStorage.removeItem(KEY); } catch {} render(); announce('공개 목록으로 되돌렸습니다.'); } };
window.addEventListener('beforeunload', event => { if (!storageAvailable) { event.preventDefault(); event.returnValue = ''; } });
(async () => {
  let warning = '';
  try { const response = await fetch('games.json', {cache:'no-store'}); if (!response.ok) throw Error(); published = validate(await response.json()); }
  catch { warning = '공개 목록을 읽지 못했습니다. 로컬 서버로 실행하거나 games.json 파일을 확인하세요.'; }
  games = structuredClone(published);
  try { const draft = localStorage.getItem(KEY); if (draft) { games = validate(JSON.parse(draft)); warning = '이 브라우저에 저장된 편집본을 표시합니다. 최신 공개 목록은 관리 모드에서 되돌릴 수 있습니다.'; } }
  catch { warning += ' 브라우저 임시 저장을 읽지 못했습니다.'; }
  render(); announce(warning);
})();
