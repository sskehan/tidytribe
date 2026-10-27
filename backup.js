// Tidy Tribe — Dropbox backups (same approach as Our Tax and MyGarage).
// Firebase is the live copy; Dropbox keeps safety copies:
//   Dropbox › Apps › <your Tidy Tribe app>
//     snapshots/tidytribe-YYYY-MM-DD.json   one a day (plus one before every restore), kept 60 days
//     archive/tidytribe-YYYY-MM.json        the last copy of each month, kept 3 years
// The connection is saved on this phone only. The App secret is never used (PKCE sign-in).

export const DBX_APP_KEY = ''; // public App key from the Dropbox App Console (can also be pasted in the app)
const STORE_KEY = 'tidytribe-dbx';
const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const KEEP_DAYS = 60;
const KEEP_ARCHIVE_YEARS = 3;
const DATE_KEYS = ['at', 'undoUntil', 'createdAt', 'closedAt'];

export function redirectUri() { return location.origin + location.pathname.replace(/index\.html$/, ''); }
export function meta() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return {}; } }
export function setMeta(patch) {
  const m = Object.assign(meta(), patch);
  try { localStorage.setItem(STORE_KEY, JSON.stringify(m)); } catch (e) { /* storage blocked */ }
  return m;
}
export const appKey = () => DBX_APP_KEY || meta().key || '';
export const connected = () => !!meta().refresh;
export const wifiOnly = () => meta().wifiOnly !== false;
export const onMobileData = () => !!(navigator.connection && navigator.connection.type === 'cellular');
export const blockedOnMobile = () => wifiOnly() && onMobileData();

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const pad = (n) => String(n).padStart(2, '0');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dbxArg = (o) => JSON.stringify(o).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
class DbxErr extends Error { constructor(m, status, summary) { super(m); this.status = status; this.summary = summary || ''; } }
const notFound = (e) => e instanceof DbxErr && e.status === 409 && /not_found/.test(e.summary);

// ---------- sign-in ----------
export async function connect(keyIn) {
  if (!navigator.onLine) throw new Error("You're offline. Connect Dropbox when you have internet.");
  const key = (DBX_APP_KEY || keyIn || meta().key || '').trim();
  if (!/^[a-z0-9]{8,}$/i.test(key)) throw new Error('Paste the App key from the Dropbox App Console first');
  const v = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)));
  setMeta({ key, pkce: { v, state }, error: null });
  location.href = 'https://www.dropbox.com/oauth2/authorize?' + new URLSearchParams({
    client_id: key, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256',
    redirect_uri: redirectUri(), token_access_type: 'offline', state
  });
}
// Called once when the app opens. Returns a message to show, or null if this wasn't a Dropbox return.
export async function handleReturn() {
  const p = new URLSearchParams(location.search);
  if (!p.has('code') && !p.has('error')) return null;
  history.replaceState(null, '', redirectUri());
  if (p.has('error')) return { ok: false, msg: 'Dropbox not connected: ' + (p.get('error_description') || p.get('error')).replace(/\+/g, ' ') };
  const m = meta();
  if (!m.pkce || p.get('state') !== m.pkce.state) return { ok: false, msg: "That Dropbox sign-in didn't match. Tap Connect Dropbox again." };
  try {
    const r = await fetch(TOKEN_URL, { method: 'POST', body: new URLSearchParams({ grant_type: 'authorization_code', code: p.get('code'), client_id: appKey(), code_verifier: m.pkce.v, redirect_uri: redirectUri() }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.refresh_token) throw new Error(j.error_description || j.error || 'HTTP ' + r.status);
    setMeta({ refresh: j.refresh_token, access: j.access_token, expires: Date.now() + (j.expires_in || 14400) * 1000, pkce: null, error: null, lastSnapDay: null });
    return { ok: true, msg: 'Dropbox connected — backing up now' };
  } catch (e) {
    setMeta({ pkce: null, error: 'Dropbox sign-in failed: ' + (e.message || e) });
    return { ok: false, msg: 'Dropbox sign-in failed: ' + (e.message || e) };
  }
}
export function disconnect() { setMeta({ refresh: null, access: null, expires: 0, error: null }); }

// ---------- API ----------
async function token() {
  const m = meta();
  if (!m.refresh) throw new Error('Dropbox is not connected');
  if (m.access && m.expires > Date.now() + 60000) return m.access;
  const r = await fetch(TOKEN_URL, { method: 'POST', body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: m.refresh, client_id: appKey() }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (j.error === 'invalid_grant') setMeta({ refresh: null, access: null, error: 'Dropbox access was removed or has expired. Connect Dropbox again.' });
    throw new Error(j.error_description || j.error || 'HTTP ' + r.status);
  }
  setMeta({ access: j.access_token, expires: Date.now() + (j.expires_in || 14400) * 1000 });
  return j.access_token;
}
async function call(url, opt, retry = true) {
  const tok = await token();
  const o = opt || {};
  const r = await fetch(url, Object.assign({ method: 'POST' }, o, { headers: Object.assign({}, o.headers || {}, { Authorization: 'Bearer ' + tok }) }));
  if (r.status === 401 && retry) { setMeta({ access: null }); return call(url, opt, false); }
  if (r.status === 429 && retry) { await sleep(3000); return call(url, opt, false); }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    let s = t; try { s = JSON.parse(t).error_summary || t; } catch (e) { /* plain text */ }
    throw new DbxErr('Dropbox ' + r.status + ': ' + String(s).slice(0, 120), r.status, String(s));
  }
  return r;
}
async function api(ep, arg) {
  const r = await call('https://api.dropboxapi.com/2/' + ep, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(arg || {}) });
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
async function upload(path, body) {
  const r = await call('https://content.dropboxapi.com/2/files/upload', { headers: { 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': dbxArg({ path, mode: 'overwrite', autorename: false, mute: true }) }, body });
  return r.json();
}
async function download(path) {
  const r = await call('https://content.dropboxapi.com/2/files/download', { headers: { 'Dropbox-API-Arg': dbxArg({ path }) } });
  return r.text();
}
async function list(path) {
  try {
    let j = await api('files/list_folder', { path });
    let out = j.entries;
    while (j.has_more) { j = await api('files/list_folder/continue', { cursor: j.cursor }); out = out.concat(j.entries); }
    return out;
  } catch (e) { if (notFound(e)) return []; throw e; }
}

// ---------- backup files ----------
// Dates are stored as {"__date": "..."} so a restore puts them back exactly.
export function freeze(v) {
  if (v instanceof Date) return { __date: v.toISOString() };
  if (Array.isArray(v)) return v.map(freeze);
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = freeze(v[k]); return o; }
  return v;
}
export function revive(v, key) {
  if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.__date === 'string') return new Date(v.__date);
  if (typeof v === 'string' && DATE_KEYS.includes(key) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return new Date(v);
  if (Array.isArray(v)) return v.map((x) => revive(x));
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = revive(v[k], k); return o; }
  return v;
}
export function makeFile(data, version) {
  return JSON.stringify({ app: 'Tidy Tribe', version, exportedAt: new Date().toISOString(), data: freeze(data) }, null, 1);
}
export function parseFile(text) {
  let j;
  try { j = JSON.parse(text); } catch (e) { throw new Error("That file isn't a Tidy Tribe backup"); }
  if (!j || j.app !== 'Tidy Tribe' || !j.data || typeof j.data !== 'object') throw new Error("That file isn't a Tidy Tribe backup");
  if (!j.data.config || !j.data.config.main) throw new Error('That backup has no settings in it, so it was not used');
  return { data: revive(j.data), exportedAt: j.exportedAt, version: j.version };
}
function snapName(kind) {
  const d = new Date();
  return '/snapshots/tidytribe-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + (kind ? '-' + pad(d.getHours()) + pad(d.getMinutes()) + '-' + kind : '') + '.json';
}
// kind: '' = daily copy, 'manual', 'before-restore'
export async function backupNow(dumpAll, version, kind) {
  const body = makeFile(await dumpAll(), version);
  const d = new Date();
  await upload(snapName(kind || ''), body);
  if (!kind || kind === 'manual') await upload('/archive/tidytribe-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '.json', body);
  setMeta({ lastSnap: Date.now(), lastSnapDay: d.toDateString(), error: null });
  prune().catch(() => {});
}
export async function prune() {
  const cut = Date.now() - KEEP_DAYS * 864e5;
  const now = new Date();
  const acut = new Date(now.getFullYear() - KEEP_ARCHIVE_YEARS, now.getMonth(), 1).getTime();
  for (const e of await list('/snapshots')) {
    const m = e.name.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (e['.tag'] === 'file' && m && new Date(+m[1], m[2] - 1, +m[3]).getTime() < cut) { try { await api('files/delete_v2', { path: e.path_lower }); } catch (x) { /* try next time */ } }
  }
  for (const e of await list('/archive')) {
    const m = e.name.match(/(\d{4})-(\d{2})\.json$/);
    if (e['.tag'] === 'file' && m && new Date(+m[1], m[2] - 1, 1).getTime() < acut) { try { await api('files/delete_v2', { path: e.path_lower }); } catch (x) { /* try next time */ } }
  }
}
export async function listBackups() {
  const all = (await list('/snapshots')).concat(await list('/archive'));
  return all.filter((e) => e['.tag'] === 'file' && /\.json$/i.test(e.name))
    .sort((a, b) => String(b.server_modified).localeCompare(String(a.server_modified)))
    .map((e) => ({
      path: e.path_lower, when: e.server_modified, size: e.size,
      kind: /archive/.test(e.path_lower) ? 'Monthly copy' : /before-restore/.test(e.name) ? 'Saved before a restore' : /manual/.test(e.name) ? 'Backed up by hand' : 'Daily copy'
    }));
}
export async function readBackup(path) { return parseFile(await download(path)); }
