// Tidy Tribe v1.0 — family chores, points and rewards.
import * as L from './logic.js';
import { createStore, inc, COLLECTIONS } from './store.js';
import * as B from './backup.js';
import { SEED_CONFIG, SEED_CHORES, SEED_REWARDS, SEED_BALANCES, SEED_TURNS } from './seed.js';
import { FIREBASE_CONFIG } from './firebase-config.js';

const VERSION = '1.14';
const ADULTS = ['shaun', 'lyndsey', 'heidi'];
const KIDS_WITH_PHONES = ['alex', 'emma'];
const LOGIN_PEOPLE = [['shaun', 'Shaun'], ['lyndsey', 'Lyndsey'], ['heidi', 'Heidi'], ['alex', 'Alex'], ['emma', 'Emma']];
const ADMIN_MINUTES = 10;
const h = L.esc;

const S = {
  store: null, user: undefined, config: undefined,
  chores: [], rewards: [], balances: {}, prefs: {}, turns: {}, meds: {}, magic: [], completions: [], reqPending: [], reqRecent: [], stars: [], adjustments: [],
  view: { screen: 'picker', tab: 'today' }, login: { who: null }, pin: null, admin: null, form: {},
  unsubs: [], subsKey: '', error: null, pendingRender: false
};
const app = document.getElementById('app');

// ---------- icons ----------
const P = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  swap: '<path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/>',
  house: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13"/><path d="M3 12h18"/><path d="M12 8c-2-4-6-4-6-1s6 1 6 1c0 0 6 2 6-1s-4-3-6 1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  tasks: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12l3 3 5-6"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5"/><path d="M12 6.5v11"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M16 4a3.5 3.5 0 0 1 0 7"/><path d="M18 14c2 .7 3 2.8 3 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.9 19.1l1.4-1.4"/><path d="M17.7 6.3l1.4-1.4"/>',
  book: '<path d="M4 19V6a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2"/><path d="M8 8h6"/>',
  cloud: '<path d="M7 18a5 5 0 0 1-.5-10A6 6 0 0 1 18 9a4.5 4.5 0 0 1-1 9"/><path d="M12 12v8"/><path d="M9 17l3 3 3-3"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 14h10l1-14"/>',
  dish: '<circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3.5"/><path d="M6 4c1 1.5 3 1.5 4 0"/>',
  dishwasher: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16"/><path d="M8 12v5"/><path d="M12 12v5"/><path d="M16 12v5"/>',
  toys: '<path d="M3 10h18l-2 10H5z"/><circle cx="9" cy="6" r="2.5"/><path d="M14 3l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2"/>',
  bath: '<path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 20l-1 2"/><path d="M17 20l1 2"/>',
  teeth: '<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7.5.5 3 1 6 2.5 6s1.5-4 3-6c.5-.7 1-.7 1.5 0 1.5 2 1.5 6 3 6s2-3 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>',
  bin: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 14h10l1-14"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  clothes: '<path d="M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>',
  bed: '<path d="M3 18V8"/><path d="M3 14h18v4"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
  food: '<circle cx="12" cy="13" r="8"/><path d="M8 13a4 4 0 0 0 8 0"/><path d="M12 2v3"/>',
  pill: '<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-30 12 12.5)"/><path d="M9.5 8.2l4 7"/>',
  chook: '<path d="M8 20h8"/><path d="M12 20v-3"/><path d="M6 11a6 6 0 0 0 12 0c0-3-2-5-4-6l1-2-3 1c-3 0-6 3-6 7z"/><circle cx="14" cy="8" r=".8"/>',
  table: '<path d="M3 9h18"/><path d="M5 9v10"/><path d="M19 9v10"/><path d="M8 5h8"/>',
  bag: '<rect x="5" y="7" width="14" height="14" rx="3"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/><path d="M5 13h14"/>',
  icecream: '<path d="M7 11a5 5 0 0 1 10 0"/><path d="M6 11h12l-6 11z"/><path d="M9 14.5l3 3 3-3"/>',
  screen: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 9.5v5l4-2.5z"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v4"/><path d="M18 10v4"/>',
  game: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3"/><path d="M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
  movie: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M8 5l-2 4"/><path d="M14 5l-2 4"/><path d="M20 5l-2 4"/>',
  star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>'
};
function ico(name, size = 22, sw = 2, colour = 'currentColor') {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + colour + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || P.star) + '</svg>';
}
function starIco(size = 18, fill = '#FACC15') {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + fill + '" aria-hidden="true">' + P.star + '</svg>';
}
function coinIco(size = 18) {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#FACC15" stroke="#A16207" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="#A16207" stroke-width="1.5"/></svg>';
}
function choreIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('dishwasher') || n.includes('unstack')) return 'dishwasher';
  if (n.includes('dish')) return 'dish';
  if (n.includes('toy')) return 'toys';
  if (n.includes('bath') || n.includes('shower') || n.includes('wash')) return 'bath';
  if (n.includes('teeth')) return 'teeth';
  if (n.includes('rubbish') || n.includes('recycl') || n.includes('bin')) return 'bin';
  if (n.includes('cloth') || n.includes('uniform')) return 'clothes';
  if (n.includes('bed')) return 'bed';
  if (n.includes('breakfast') || n.includes('lunch') || n.includes('dinner') || n.includes('eat')) return 'food';
  if (n.includes('read') || n.includes('homework') || n.includes('book')) return 'book';
  if (/\b(meds?|medic\w*|medicine|tablets?|pills?|capsules?|gumm\w*|vitamins?|ritalin)\b/.test(n)) return 'pill';
  if (n.includes('chook') || n.includes('chicken')) return 'chook';
  if (n.includes('table')) return 'table';
  if (n.includes('bag')) return 'bag';
  return 'star';
}
const GROUP_ICON = { morning: 'sun', afterschool: 'book', evening: 'moon', household: 'house' };
const TILE_COLOURS = ['#2563EB', '#DC2626', '#C2410C', '#0E7490', '#DB2777', '#15803D', '#7C3AED', '#B45309'];
const REWARD_COLOURS = [['#DB2777', '#9D174D'], ['#0369A1', '#075985'], ['#15803D', '#166534'], ['#7C3AED', '#5B21B6'], ['#B45309', '#92400E'], ['#0F766E', '#115E59']];
const REWARD_ICONS = [['icecream', 'Ice cream'], ['screen', 'Screen time'], ['gift', 'Gift'], ['game', 'Game'], ['movie', 'Movie'], ['food', 'Food'], ['cash', 'Money'], ['star', 'Star']];

// ---------- helpers ----------
let toastTimer;
function toast(msg, bad) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 2800);
}
function rid(prefix) {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return (prefix ? prefix + '-' : '') + Array.from(a, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10);
}
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'item'; }
async function pinHash(adult, pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('tidytribe:' + adult + ':' + pin));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}
function write(ops, okMsg) {
  const p = S.store.batch(ops);
  p.then(() => { if (okMsg && S.store.mode === 'demo') toast(okMsg); }).catch((e) => {
    console.error(e);
    toast(e && e.code === 'permission-denied' ? 'Not allowed — that change was blocked.' : 'Could not save: ' + (e.message || e), true);
  });
  if (okMsg && S.store.mode !== 'demo') toast(okMsg);
  return p;
}
const isAdultUser = () => ADULTS.includes(S.user);
const isKidUser = () => KIDS_WITH_PHONES.includes(S.user);
function adminOn() { return S.admin && Date.now() < S.admin.until; }
function touchAdmin() { if (S.admin) S.admin.until = Date.now() + ADMIN_MINUTES * 60000; }
function houseName(hid) { return (S.config.houses[hid] && S.config.houses[hid].name) || hid; }
function kidName(k) { return (S.config.kids[k] && S.config.kids[k].name) || k; }
function adultName(a) { return (S.config.adults && S.config.adults[a] && S.config.adults[a].name) || (a ? a[0].toUpperCase() + a.slice(1) : ''); }
function colourOf(k) { return L.kidColour(k, S.config, S.prefs); }
// Inline style for anything painted in the kid's colour: background colour, readable text, deep shade for text on white.
function kidVars(k) { const c = colourOf(k); const light = L.inkOn(c) !== '#FFFFFF'; return '--kid:' + c + ';--kid-ink:' + L.inkOn(c) + ';--kid-deep:' + L.deepOf(c) + ';--kid-track:' + (light ? 'rgba(23,32,51,.14)' : 'rgba(255,255,255,.28)') + ';--kid-btn:' + (light ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.2)'); }
function deviceHouse() { return isAdultUser() ? L.adultHouse(S.user, S.config) : null; }
function adminHouse() { return S.admin ? L.adultHouse(S.admin.as, S.config) : null; }
function isOwner() { return !!S.admin && S.admin.as === ((S.config && S.config.owner) || 'shaun'); }
// The house whose chores are being managed: your own, or (owner only) whichever house you picked.
function choreHouse() { return (isOwner() && S.view.choreHouse && S.config.houses[S.view.choreHouse]) ? S.view.choreHouse : adminHouse(); }
function perDollar() { return S.config.pointsPerDollar || 100; }
function points(k) { return (S.balances[k] && S.balances[k].points) || 0; }
function pendingFor(k) { return S.reqPending.filter((r) => r.kid === k && r.status === 'pending'); }
function heldFor(k) { return pendingFor(k).reduce((s, r) => s + (r.pts || 0), 0); }
function available(k) { return points(k) - heldFor(k); }
function completionMap() { const m = {}; for (const c of S.completions) m[c.id] = c; return m; }
// Above and Beyond tallies run from one "Close this tally" to the next (e.g. Christmas to Christmas).
function curPeriod() {
  const today = L.dateKey(new Date());
  return (S.config && S.config.starPeriod) || { id: 'y' + today.slice(0, 4), start: today.slice(0, 4) + '-01-01' };
}
function starPeriodOf(st) { return st.period || ('y' + st.year); }
function starsThisYear(k) { const p = curPeriod().id; return S.stars.filter((st) => st.kid === k && starPeriodOf(st) === p); }
function shortDate(key) { return L.fmtKey(key).replace(/^\w+ /, ''); }
function sinceText() { return 'since ' + shortDate(curPeriod().start); }
function pastTallies(k) {
  return (S.config.starHistory || []).slice().reverse().map((t) => ({ label: t.label, n: (t.totals || {})[k] || 0 }));
}
function choreCtx(key) {
  const doneBy = {};
  for (const c of S.completions) if (c.date === key) doneBy[c.choreId] = c.kid;
  const turns = {};
  for (const [id, t] of Object.entries(S.turns)) turns[id] = t.kid;
  return { turns, doneBy };
}
function groupOf(ch) { return L.GROUPS.find((g) => g.id === ch.group) || L.GROUPS[0]; }
function shareText(ch, k) {
  const mode = L.shareMode(ch);
  if (mode === 'each') return '';
  const others = ch.kids.filter((x) => x !== k).map(kidName).join(' & ');
  return mode === 'turns' ? 'Your turn · then ' + others : 'Your turn today · swaps with ' + others;
}
function todayInfo(k) {
  const now = new Date();
  const key = L.dateKey(now);
  const list = L.choresFor(k, key, S.chores, S.config, choreCtx(key));
  const cm = completionMap();
  let done = 0; let pts = 0;
  let need = 0; let needDone = 0;
  for (const ch of list) {
    const c = cm[L.completionId(k, key, ch.id)];
    if (c) { done++; pts += c.pts || 0; }
    // Take-turns chores (bins, dishwasher) are done when needed, so they don't hold up the Magic button.
    if (!ch.optional && L.shareMode(ch) !== 'turns') { need++; if (c) needDone++; }
  }
  // need / needDone: chores that count for the Magic button (optional ones don't).
  return { now, key, list, cm, done, pts, total: list.length, need, needDone };
}
// ---------- Magic button ----------
function magicOn(k) { return L.magicCfg(S.config).kids.includes(k); }
function magicDates(k) { return new Set(S.magic.filter((c) => c.kid === k).map((c) => c.date)); }
function hasChoresOn(k, key) { return L.choresFor(k, key, S.chores, S.config).some((c) => !c.optional && L.shareMode(c) !== 'turns'); }
function magicRun(k) {
  const today = L.dateKey(new Date());
  const tapped = magicDates(k);
  return L.magicStreak(tapped, tapped.has(today) ? today : L.addDays(today, -1), (d) => hasChoresOn(k, d));
}
function magicCard(k, t) {
  if (!magicOn(k) || !t.need) return '';
  const m = L.magicCfg(S.config);
  const cid = L.completionId(k, t.key, 'magic');
  const tapped = !!t.cm[cid] || magicDates(k).has(t.key);
  const run = magicRun(k);
  const toStar = m.streakDays - (run % m.streakDays);
  if (tapped) {
    return '<div class="magic done"><span class="magic-ico">' + starIco(30, '#FACC15') + '</span><div class="grow col" style="gap:2px"><div style="font-family:var(--display);font-weight:600;font-size:20px">Magic done tonight!</div><div class="small">' + run + ' night' + (run === 1 ? '' : 's') + ' in a row · ' + (run % m.streakDays === 0 ? 'star earned!' : toStar + ' more for a star') + '</div></div></div>';
  }
  if (!L.inMagicWindow(t.now, m)) return '';
  const left = t.need - t.needDone;
  if (left > 0) {
    return '<div class="magic waiting"><span class="magic-ico">' + starIco(30, '#94A3B8') + '</span><div class="grow col" style="gap:2px"><div style="font-family:var(--display);font-weight:600;font-size:20px">Magic button</div><div class="small">Finish ' + left + ' more chore' + (left === 1 ? '' : 's') + ' before ' + L.fmtTime(m.to) + ' to unlock +' + m.pts + '</div></div></div>';
  }
  return '<button type="button" class="magic ready" data-act="magic" data-kid="' + k + '"><span class="magic-ico">' + starIco(34, '#422006') + '</span><span class="grow col" style="gap:2px;text-align:left"><span style="font-family:var(--display);font-weight:600;font-size:22px">Tap the Magic button!</span><span class="small">All done today · +' + m.pts + ' points' + (run + 1 >= m.streakDays && (run + 1) % m.streakDays === 0 ? ' and a star!' : ' · night ' + (run + 1) + ' in a row') + '</span></span></button>';
}
function magicTap(k) {
  const m = L.magicCfg(S.config);
  const t = todayInfo(k);
  const cid = L.completionId(k, t.key, 'magic');
  if (t.cm[cid] || magicDates(k).has(t.key)) return;
  if (!L.inMagicWindow(t.now, m)) { toast('The Magic button opens ' + L.fmtTime(m.from) + '–' + L.fmtTime(m.to), true); return; }
  if (!t.need || t.needDone < t.need) { toast('Finish all of today\'s chores first', true); return; }
  const house = L.houseAt(k, L.localMs(t.now), S.config);
  const run = magicRun(k) + 1;
  const ops = [
    { op: 'set', path: 'completions/' + cid, data: { kid: k, choreId: 'magic', choreName: 'Magic button', pts: m.pts, date: t.key, at: t.now, undoUntil: L.nextMidnight(t.now), by: S.user, house } },
    { op: 'update', path: 'balances/' + k, data: { points: inc(m.pts), lastOp: cid } }
  ];
  const star = run % m.streakDays === 0;
  if (star) {
    ops.push({ op: 'set', path: 'stars/magic_' + k + '_' + t.key, data: { kid: k, what: m.streakDays + ' Magic nights in a row', note: '', by: 'magic', house, at: t.now, date: t.key, year: t.key.slice(0, 4), period: curPeriod().id } });
  }
  write(ops);
  toast(star ? 'WOW! ' + m.streakDays + ' nights in a row — you earned a star!' : '+' + m.pts + ' Magic points! ' + run + ' night' + (run === 1 ? '' : 's') + ' in a row');
}
function magicHistory(k) {
  if (!magicOn(k)) return '';
  const m = L.magicCfg(S.config);
  const today = L.dateKey(new Date());
  const tapped = magicDates(k);
  const run = magicRun(k);
  let dots = '';
  for (let i = 29; i >= 0; i--) {
    const d = L.addDays(today, -i);
    const cls = tapped.has(d) ? 'on' : !hasChoresOn(k, d) ? 'off' : i === 0 ? 'today' : '';
    dots += '<i class="' + cls + '" title="' + L.fmtKey(d) + '"></i>';
  }
  const toStar = m.streakDays - (run % m.streakDays);
  return '<div class="card" style="background:#1E2A5A;color:#fff;border-radius:26px;padding:18px;gap:12px;box-shadow:0 6px 0 #312E81">' +
    '<div class="row" style="gap:12px">' + starIco(44, '#FACC15') + '<div class="col" style="gap:0"><div class="eyebrow" style="color:#C7D2FE">Magic nights in a row</div><div style="font-family:var(--display);font-weight:600;font-size:40px;line-height:1">' + run + '</div><div class="small" style="color:#C7D2FE">' + (run > 0 && run % m.streakDays === 0 ? 'Star earned! Next one in ' + m.streakDays + ' more nights' : toStar + ' more for an Above &amp; Beyond star') + '</div></div></div>' +
    '<div class="mdots" role="img" aria-label="Magic button over the last 30 days">' + dots + '</div>' +
    '<div class="small" style="color:#C7D2FE">Tick every chore, then tap the Magic button between ' + L.fmtTime(m.from) + ' and ' + L.fmtTime(m.to) + ' for +' + m.pts + '. Grey dots are days with no chores.</div></div>';
}
// ---------- weekly check (points off if too few chores done) ----------
function penaltyOn(k) { const P = L.penaltyCfg(S.config); return P.on && P.kids.includes(k); }
function doneIdsFor(k) { return new Set(S.completions.filter((c) => c.kid === k).map((c) => c.id)); }
let penaltyBusy = false;
// Runs on adult phones only (kids can't take their own points). Checks the last two finished custody
// weeks; each kid/week is charged at most once (the record id is fixed and the rules make it create-only).
async function applyPenalties() {
  const P = L.penaltyCfg(S.config || {});
  if (penaltyBusy || !P.on || !isAdultUser() || !S.config || !S.fresh || !S.fresh.completions || !S.fresh.chores || !S.fresh.balances || !navigator.onLine) return;
  if (S.store.mode !== 'demo' && !P.since) return;
  penaltyBusy = true;
  try {
    const now = new Date();
    const todayKey = L.dateKey(now);
    const since = P.since ? L.localMs(new Date(P.since)) : 0;
    const cur = L.penaltyPeriod(L.localMs(now), S.config);
    const visible = L.kidsForHouse(L.adultHouse(S.user, S.config), S.config);
    for (const back of [2, 1]) {
      const start = cur.start - back * L.WEEK;
      const end = start + L.WEEK;
      if (start < since) continue;                  // never charge the week the check was switched on
      if (L.msKey(end) >= todayKey) continue;       // wait until the day after the week ends
      for (const k of P.kids) {
        if (!visible.includes(k) || !S.config.kids[k]) continue;
        const id = 'penalty_' + k + '_' + L.msKey(start);
        if (await S.store.exists('adjustments/' + id)) continue;
        const r = L.periodChores(k, start, end, S.chores, S.config, doneIdsFor(k));
        if (!r.due || r.done / r.due * 100 >= P.pct) continue;
        const take = P.floor ? Math.min(P.pts, Math.max(0, points(k))) : P.pts;
        const pct = Math.round(r.done / r.due * 100);
        await S.store.batch([
          { op: 'set', path: 'adjustments/' + id, data: { kid: k, pts: -take, reason: 'Only ' + pct + '% of chores done (' + r.done + ' of ' + r.due + '), week from ' + L.fmtKey(L.msKey(start)), by: 'auto', at: new Date(), period: L.msKey(start), auto: true } },
          { op: 'update', path: 'balances/' + k, data: { points: inc(-take), lastOp: 'adj_' + id } }
        ]);
      }
    }
  } catch (e) { console.warn('weekly check', e); } finally { penaltyBusy = false; }
}
function penaltyKidCards(k) {
  if (!penaltyOn(k)) return '';
  const P = L.penaltyCfg(S.config);
  let out = '';
  const recent = S.adjustments.filter((a) => a.kid === k && a.auto && a.at && (Date.now() - a.at.getTime()) < 9 * 864e5);
  for (const a of recent) out += '<div class="card" style="background:#FEE2E2;border:2px solid #FCA5A5"><div class="row" style="justify-content:space-between"><div style="font-weight:800;color:#991B1B">Points taken off</div><div style="font-family:var(--display);font-weight:600;font-size:22px;color:#B91C1C">' + a.pts + '</div></div><div class="small" style="color:#7F1D1D">' + h(a.reason) + '</div></div>';
  const nowL = L.localMs(new Date());
  const cur = L.penaltyPeriod(nowL, S.config);
  const r = L.periodChores(k, cur.start, Math.min(cur.end, L.keyToLocalMs(L.addDays(L.dateKey(new Date()), 1), '00:00')), S.chores, S.config, doneIdsFor(k));
  if (r.due) {
    const pct = Math.round(r.done / r.due * 100);
    const ok = pct >= P.pct;
    out += '<div class="card" style="border:2px solid ' + (ok ? '#BBF7D0' : '#FDBA74') + ';background:' + (ok ? '#F0FDF4' : '#FFF7ED') + '"><div class="row" style="justify-content:space-between;align-items:baseline"><div class="lbl">Chores this custody week</div><div style="font-family:var(--display);font-weight:600;font-size:22px">' + pct + '%</div></div>' +
      '<div class="bar grey" style="height:12px;position:relative"><i style="width:' + Math.min(100, pct) + '%;background:' + (ok ? '#16A34A' : '#EA580C') + '"></i></div>' +
      '<div class="small" style="color:' + (ok ? '#166534' : '#9A3412') + ';font-weight:700">' + r.done + ' of ' + r.due + ' done so far. ' + (ok ? 'Great — stay above ' + P.pct + '% to keep all your points.' : 'Get above ' + P.pct + '% by ' + L.fmtLocalMs(cur.end) + ' or lose ' + P.pts + ' points.') + '</div></div>';
  }
  return out;
}
function penaltySettingsCard() {
  const P = L.penaltyCfg(S.config);
  const kids = L.kidsForHouse(adminHouse(), S.config);
  return '<form data-form="penalty-settings" class="card" style="border:2px solid #FECACA"><h2 style="font-size:18px">Weekly check</h2>' +
    '<p class="small muted" style="margin:0">At the end of each custody week (changeover to changeover), points come off any kid who did fewer than the set share of their chores.</p>' +
    '<label class="check"><input type="checkbox" name="on"' + (P.on ? ' checked' : '') + '><span style="font-weight:800">Take points off when chores aren\'t done</span></label>' +
    '<div class="grid2"><div class="field"><label for="pn-pct">If fewer than (%)</label><input class="input" id="pn-pct" name="pct" type="number" min="1" max="100" required value="' + P.pct + '"></div><div class="field"><label for="pn-pts">Points taken off</label><input class="input" id="pn-pts" name="pts" type="number" min="1" max="100000" required value="' + P.pts + '"></div></div>' +
    '<label class="check"><input type="checkbox" name="floor"' + (P.floor ? ' checked' : '') + '><span style="font-weight:800">Never go below 0 points</span></label>' +
    '<div class="lbl">Who it applies to</div><div class="chips">' + kids.map((k) => '<label class="check" style="padding:0 14px;border:2px solid ' + colourOf(k) + ';border-radius:999px"><input type="checkbox" name="kids" value="' + k + '"' + (P.kids.includes(k) ? ' checked' : '') + '><span style="font-weight:800">' + h(kidName(k)) + '</span></label>').join('') + '</div>' +
    '<p class="small muted" style="margin:0">Checked the day after each week ends, by the first adult phone that opens the app. Take-off records show under Balances; add points back there if needed.</p>' +
    '<button class="btn primary" type="submit">Save</button></form>';
}
// ---------- weekly maximum ----------
function weeklyMax(k, house) {
  const hs = house || L.houseAt(k, L.localMs(new Date()), S.config);
  const e = L.expectedPoints(k, hs, S.chores, S.config, L.dateKey(new Date()), 28);
  return Math.round(e.perWeek + (magicOn(k) && e.daysAt ? L.magicCfg(S.config).pts * 7 : 0));
}
function fairCard(house) {
  const kids = L.kidsForHouse(house, S.config).filter((k) => S.config.kids[k].custody === 'shared');
  if (kids.length < 2) return '';
  const today = L.dateKey(new Date());
  const rows = kids.map((k) => ({ k, e: L.expectedPoints(k, house, S.chores, S.config, today, 28) })).filter((r) => r.e.daysAt > 0);
  if (rows.length < 2) return '';
  const vals = rows.map((r) => ({ k: r.k, v: weeklyMax(r.k, house) }));
  const diff = Math.max(...vals.map((x) => x.v)) - Math.min(...vals.map((x) => x.v));
  const ok = diff === 0;
  return '<div class="card" style="border:2px solid ' + (ok ? '#BBF7D0' : '#FDE68A') + ';background:' + (ok ? '#F0FDF4' : '#FFFBEB') + '">' +
    '<div class="row" style="justify-content:space-between"><div class="lbl">Max points per week at ' + h(houseName(house)) + '</div><span class="count-pill" style="background:' + (ok ? '#16A34A' : '#B45309') + ';color:#fff">' + (ok ? 'Balanced ✓' : diff + ' apart') + '</span></div>' +
    '<div class="row" style="gap:10px;flex-wrap:wrap">' + vals.map((x) => '<div class="row" style="gap:8px">' + solidAvatar(x.k, 'sm') + '<div style="font-family:var(--display);font-weight:600;font-size:24px">' + x.v + '</div></div>').join('') + '</div>' +
    '<div class="small muted">If every chore is done. Shared chores (bins, dishwasher) count as half each. ' + (ok ? '' : 'Change chore points until these match.') + '</div></div>';
}
function nextChange(k, fromMs) {
  // Earliest moment after fromMs when the kid's house changes: pattern changeovers or override edges.
  const cfg = S.config;
  if (cfg.kids[k].custody !== 'shared') return null;
  const start = L.houseAt(k, fromMs, cfg);
  const cands = [];
  let c = L.nextChangeover(fromMs, cfg);
  for (let i = 0; i < 12; i++) { cands.push(c); c += L.WEEK; }
  for (const o of cfg.overrides || []) { cands.push(L.parseLocal(o.from), L.parseLocal(o.to)); }
  cands.sort((a, b) => a - b);
  for (const t of cands) {
    if (t <= fromMs) continue;
    const hs = L.houseAt(k, t, cfg);
    if (hs !== start) return { at: t, to: hs };
  }
  return null;
}
function sharedKids() { return Object.keys(S.config.kids).filter((k) => S.config.kids[k].custody === 'shared'); }

// ---------- data ----------
function subscribe() {
  const key = L.dateKey(new Date());
  const year = key.slice(0, 4);
  const sk = S.user + '|' + key;
  if (S.subsKey === sk) return;
  S.unsubs.forEach((u) => { try { u(); } catch (e) { /* ignore */ } });
  S.unsubs = [];
  S.medsOn = false;
  S.subsKey = sk;
  const onErr = (e) => { console.error(e); S.error = e && e.code === 'permission-denied' ? 'This account is not allowed to read the family data. Check the sign-in name and the security rules (SETUP.md step 6).' : 'Connection problem: ' + (e.message || e); render(); };
  const st = S.store;
  S.unsubs.push(st.listen('config', { doc: 'main' }, (d) => { S.config = d; render(); if (d && !S.medsOn) { subscribeMeds(); setTimeout(autoBackup, 4000); setTimeout(applyPenalties, 6000); } if (d && isAdultUser() && (!d.magic || !d.owner || !d.penalty) && !S.migrated) { S.migrated = true; write([{ op: 'update', path: 'config/main', data: Object.assign(d.magic ? {} : { magic: L.MAGIC_DEFAULT }, d.owner ? {} : { owner: 'shaun' }, d.penalty ? {} : { penalty: Object.assign({}, L.PENALTY_DEFAULT, { since: Date.now() }) }) }]); } }, onErr));
  S.unsubs.push(st.listen('chores', {}, (rows, pend, cached) => { S.chores = rows; if (!cached) S.fresh.chores = true; render(); }, onErr));
  S.unsubs.push(st.listen('rewards', {}, (rows) => { S.rewards = rows; render(); }, onErr));
  S.unsubs.push(st.listen('balances', {}, (rows, pend, cached) => { S.balances = Object.fromEntries(rows.map((r) => [r.id, r])); if (!cached) S.fresh.balances = true; render(); }, onErr));
  S.unsubs.push(st.listen('prefs', {}, (rows) => { S.prefs = Object.fromEntries(rows.map((r) => [r.id, r])); render(); }, onErr));
  S.unsubs.push(st.listen('turns', {}, (rows) => { S.turns = Object.fromEntries(rows.map((r) => [r.id, r])); render(); }, onErr));
  S.fresh = {};
  S.unsubs.push(st.listen('completions', { where: ['date', '>=', L.addDays(key, -24)] }, (rows, pend, cached) => { S.completions = rows; if (!cached) S.fresh.completions = true; render(); }, onErr));
  S.unsubs.push(st.listen('completions', { where: ['choreId', '==', 'magic'] }, (rows) => { S.magic = rows; render(); }, onErr));
  S.unsubs.push(st.listen('requests', { where: ['status', '==', 'pending'] }, (rows) => { S.reqPending = rows; render(); }, onErr));
  S.unsubs.push(st.listen('requests', { orderBy: ['createdAt', 'desc'], limit: 40 }, (rows) => { S.reqRecent = rows; render(); }, onErr));
  S.unsubs.push(st.listen('stars', { orderBy: ['at', 'desc'], limit: 3000 }, (rows) => { S.stars = rows; render(); }, onErr));
  S.unsubs.push(st.listen('adjustments', { orderBy: ['at', 'desc'], limit: 30 }, (rows) => { S.adjustments = rows; render(); }, onErr));
  if (S.config) subscribeMeds();
}
// Medication notes: one document per kid. Each phone only listens to the kids it is allowed to see.
function medsKids() {
  if (!S.config) return [];
  if (isKidUser()) return [S.user];
  const h0 = L.adultHouse(S.user, S.config);
  return h0 ? L.kidsForHouse(h0, S.config) : [];
}
function subscribeMeds() {
  S.medsOn = true;
  for (const k of medsKids()) {
    S.unsubs.push(S.store.listen('meds', { doc: k }, (d) => { S.meds[k] = d; render(); }, (e) => console.warn('meds', k, e)));
  }
}
function unsubscribeAll() {
  S.unsubs.forEach((u) => { try { u(); } catch (e) { /* ignore */ } });
  S.unsubs = []; S.subsKey = ''; S.medsOn = false;
  Object.assign(S, { config: undefined, chores: [], rewards: [], balances: {}, prefs: {}, turns: {}, meds: {}, magic: [], completions: [], reqPending: [], reqRecent: [], stars: [], adjustments: [], error: null });
}

// ---------- actions ----------
function tick(kid, choreId) {
  const { now, key, cm } = todayInfo(kid);
  const ch = S.chores.find((c) => c.id === choreId);
  if (!ch) return;
  const cid = L.completionId(kid, key, choreId);
  const existing = cm[cid];
  if (existing) {
    if (!isAdultUser() && existing.undoUntil && existing.undoUntil <= now) { toast('Too late to undo — ask an adult.', true); return; }
    const ops = [
      { op: 'delete', path: 'completions/' + cid },
      { op: 'update', path: 'balances/' + kid, data: { points: inc(-(existing.pts || 0)), lastOp: cid } }
    ];
    const tn = S.turns[choreId];
    if (L.shareMode(ch) === 'turns' && tn && tn.lastCid === cid) ops.push({ op: 'set', path: 'turns/' + choreId, data: { kid, lastCid: cid, prev: kid } });
    write(ops);
  } else {
    const ops = [
      { op: 'set', path: 'completions/' + cid, data: { kid, choreId, choreName: ch.name, pts: ch.pts, date: key, at: now, undoUntil: L.nextMidnight(now), by: S.user, house: ch.house } },
      { op: 'update', path: 'balances/' + kid, data: { points: inc(ch.pts), lastOp: cid } }
    ];
    const turnBased = L.shareMode(ch) === 'turns';
    if (turnBased) ops.push({ op: 'set', path: 'turns/' + choreId, data: { kid: L.nextInTurn(ch, kid), lastCid: cid, prev: kid } });
    write(ops);
    toast('+' + ch.pts + ' points!' + (turnBased ? ' Next time it\'s ' + kidName(L.nextInTurn(ch, kid)) + '\'s turn.' : ''));
  }
}
function requestReward(kid, rewardId) {
  const r = S.rewards.find((x) => x.id === rewardId);
  if (!r) return;
  if (available(kid) < r.pts) { toast('Not enough points yet.', true); return; }
  const id = rid('req');
  const house = L.houseAt(kid, L.localMs(new Date()), S.config);
  write([{ op: 'set', path: 'requests/' + id, data: { kid, type: 'reward', rewardId, title: r.name, pts: r.pts, status: 'pending', house, createdAt: new Date(), by: S.user } }], 'Request sent to ' + houseName(house));
}
function requestCashout(kid) {
  const lot = S.config.cashOutLot || 1000;
  if (available(kid) < lot) { toast('Not enough points yet.', true); return; }
  const id = rid('req');
  const house = L.houseAt(kid, L.localMs(new Date()), S.config);
  write([{ op: 'set', path: 'requests/' + id, data: { kid, type: 'cashout', title: 'Cash out ' + L.money(lot, perDollar()), pts: lot, status: 'pending', house, createdAt: new Date(), by: S.user } }], 'Cash out request sent');
}
function cancelRequest(id) {
  write([{ op: 'update', path: 'requests/' + id, data: { status: 'cancelled', closedAt: new Date() } }], 'Request cancelled');
}
function decideRequest(id, approve) {
  const r = S.reqPending.find((x) => x.id === id);
  if (!r) return;
  touchAdmin();
  if (approve) {
    if (points(r.kid) < r.pts) { toast(kidName(r.kid) + ' does not have enough points.', true); return; }
    write([
      { op: 'update', path: 'requests/' + id, data: { status: 'approved', closedAt: new Date(), closedBy: S.admin.as, paidBy: adminHouse() } },
      { op: 'update', path: 'balances/' + r.kid, data: { points: inc(-r.pts), lastOp: 'req_' + id } }
    ], 'Approved');
  } else {
    write([{ op: 'update', path: 'requests/' + id, data: { status: 'declined', closedAt: new Date(), closedBy: S.admin.as } }], 'Declined');
  }
}
function setColour(kid, colour) {
  write([{ op: 'set', path: 'prefs/' + kid, data: { colour } }]);
}
function runSetup() {
  const today = L.dateKey(new Date());
  const ops = [{ op: 'set', path: 'config/main', data: Object.assign({}, SEED_CONFIG, { starPeriod: { id: 'p' + today.replace(/-/g, ''), start: today }, starHistory: [], penalty: Object.assign({}, SEED_CONFIG.penalty, { since: Date.now() }) }) }];
  for (const c of SEED_CHORES) { const { id, ...rest } = c; ops.push({ op: 'set', path: 'chores/' + id, data: rest }); }
  for (const r of SEED_REWARDS) { const { id, ...rest } = r; ops.push({ op: 'set', path: 'rewards/' + id, data: rest }); }
  for (const [k, b] of Object.entries(SEED_BALANCES)) ops.push({ op: 'set', path: 'balances/' + k, data: b });
  for (const [c, k] of Object.entries(SEED_TURNS)) ops.push({ op: 'set', path: 'turns/' + c, data: { kid: k, lastCid: '', prev: '' } });
  write(ops, 'Tidy Tribe is set up!');
}
async function exportBackup() {
  try {
    const blob = new Blob([B.makeFile(await S.store.dumpAll(), VERSION)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tidytribe-backup-' + L.dateKey(new Date()) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('Backup downloaded');
  } catch (e) { toast('Backup failed: ' + (e.message || e), true); }
}
// ---------- Dropbox backups ----------
let backingUp = false;
async function runBackup(kind) {
  if (backingUp) return false;
  backingUp = true; render();
  try { await B.backupNow(() => S.store.dumpAll(), VERSION, kind); return true; } catch (e) {
    console.error(e);
    B.setMeta({ error: (!navigator.onLine || e instanceof TypeError) ? "Couldn't reach Dropbox. It will try again later." : String(e.message || e) });
    return false;
  } finally { backingUp = false; render(); }
}
// Once a day, from any adult phone that has Dropbox connected (Wi-Fi only unless switched off).
function autoBackup() {
  if (!S.store || !isAdultUser() || !S.config || !B.connected() || backingUp || !navigator.onLine) return;
  if (B.meta().lastSnapDay === new Date().toDateString() || B.blockedOnMobile()) return;
  runBackup('');
}
// Replaces everything in Tidy Tribe with a backup. A safety copy goes to Dropbox first when connected.
async function restoreData(data, whenText) {
  if (!confirm('Restore the copy from ' + whenText + '?\n\nEverything in Tidy Tribe (both houses) is replaced with that copy.' + (B.connected() ? ' A safety copy of the current data is saved to Dropbox first.' : ''))) return;
  touchAdmin();
  if (B.connected()) {
    const ok = await runBackup('before-restore');
    if (!ok) { toast("Couldn't save a safety copy to Dropbox first, so nothing was changed.", true); return; }
  }
  try {
    toast('Restoring…');
    const current = await S.store.dumpAll();
    const ops = [];
    for (const col of COLLECTIONS) {
      if (!(col in data)) continue; // not in this backup (or not readable by this adult): leave as is
      const want = data[col] || {};
      const have = current[col] || {};
      for (const id of Object.keys(have)) if (!(id in want)) ops.push({ op: 'delete', path: col + '/' + id });
      for (const [id, doc] of Object.entries(want)) ops.push({ op: 'set', path: col + '/' + id, data: doc });
    }
    for (let i = 0; i < ops.length; i += 400) await S.store.batch(ops.slice(i, i + 400));
    toast('Restored ✓');
    S.view = { screen: 'admin', sub: 'settings' };
    render();
  } catch (e) { console.error(e); toast('Restore failed: ' + (e.message || e), true); }
}
function whenText(iso) {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d)) return 'unknown time';
  return L.fmtKey(L.dateKey(d)) + ' ' + L.dateKey(d).slice(0, 4) + ', ' + L.fmtClock(d);
}
function backupCard() {
  const m = B.meta();
  const on = B.connected();
  const fileRow = '<div class="grid2"><button type="button" class="btn" data-act="backup">' + ico('cloud', 18, 2) + 'Download a copy</button>' +
    '<label class="btn" style="cursor:pointer">' + ico('back', 18, 2).replace('M15 5l-7 7 7 7', 'M12 19V5M5 12l7-7 7 7') + 'Restore a file<input type="file" id="restore-file" accept=".json,application/json" class="sr"></label></div>';
  if (!on) {
    return '<div class="card" style="border:2px solid #BFDBFE"><h2 style="font-size:18px">Backup</h2>' +
      '<p class="small" style="margin:0">Connect Dropbox and Tidy Tribe saves a full copy there once a day when this phone is on Wi‑Fi. It keeps 60 daily copies and one per month for 3 years, the same as Our Tax.</p>' +
      (m.error ? '<div class="banner err">' + h(m.error) + '</div>' : '') +
      (B.DBX_APP_KEY ? '' : '<div class="field"><label for="dbx-key">Dropbox App key</label><input class="input" id="dbx-key" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + h(m.key || '') + '" placeholder="from the Dropbox App Console"><div class="small muted">Redirect URI for the App Console: <b>' + h(B.redirectUri()) + '</b></div></div>') +
      '<button type="button" class="btn primary" data-act="dbx-connect">' + ico('cloud', 18, 2) + 'Connect Dropbox</button>' +
      '<p class="small muted" style="margin:0">Connect it on one adult phone only, e.g. Shaun\'s. Tidy Tribe can only see its own folder in Dropbox › Apps.</p>' + fileRow + '</div>';
  }
  const status = backingUp ? 'Backing up…' : m.error ? 'Last try failed: ' + m.error : m.lastSnap ? 'Last backup: ' + whenText(new Date(m.lastSnap)) : 'No backup yet';
  return '<div class="card" style="border:2px solid #BBF7D0"><h2 style="font-size:18px">Backup · Dropbox connected</h2>' +
    '<div class="row" style="gap:8px">' + (m.error && !backingUp ? ico('clock', 18, 2, '#B45309') : ico('check', 18, 2.6, '#15803D')) + '<div class="small" style="font-weight:800">' + h(status) + '</div></div>' +
    '<p class="small muted" style="margin:0">Backs up once a day while an adult phone has the app open. Daily copies are kept 60 days, monthly copies 3 years.</p>' +
    '<label class="check"><input type="checkbox" id="dbx-wifi"' + (B.wifiOnly() ? ' checked' : '') + '><span style="font-weight:800">Only back up on Wi‑Fi</span></label>' +
    '<div class="grid2"><button type="button" class="btn primary" data-act="dbx-now"' + (backingUp ? ' disabled' : '') + '>Back up now</button><button type="button" class="btn" data-act="admin" data-sub="restore">Restore from Dropbox</button></div>' +
    fileRow +
    '<button type="button" class="btn ghost-red" data-act="dbx-off">Disconnect Dropbox</button></div>';
}
function adminMeds() {
  const house = adminHouse();
  const kids = L.kidsForHouse(house, S.config);
  const cards = kids.map((k) => {
    const m = S.meds[k] || {};
    const hist = (m.history || []).slice(0, 6).map((e) => '<div class="list-row" style="background:#F8FAFC;align-items:flex-start"><div class="grow col"><div class="small" style="white-space:pre-line;font-weight:700;color:#334155">' + h(e.text || '(cleared)') + '</div><div class="small muted">Until ' + h(whenText(e.until || e.at)) + ' · set by ' + h(adultName(e.by)) + '</div></div></div>').join('');
    return '<form data-form="meds" class="card" style="box-shadow:0 4px 0 ' + colourOf(k) + '"><input type="hidden" name="kid" value="' + k + '">' +
      '<div class="row">' + solidAvatar(k, 'sm') + '<div class="grow col"><div style="font-weight:800;font-size:17px">' + h(kidName(k)) + '</div>' +
      '<div class="small muted">' + (m.updatedAt ? 'Updated ' + h(whenText(m.updatedAt)) + ' by ' + h(adultName(m.by)) + (m.house ? ' at ' + h(houseName(m.house)) : '') : 'Nothing noted yet') + '</div></div></div>' +
      '<div class="field"><label for="meds-' + k + '">Current medication</label><textarea class="input" id="meds-' + k + '" name="text" rows="3" maxlength="500" placeholder="e.g. Ritalin 10 mg, 1 tablet with breakfast">' + h(m.current || '') + '</textarea></div>' +
      '<button type="submit" class="btn primary">Save for both houses</button>' +
      (hist ? '<div class="lbl">Earlier</div><div class="col" style="gap:6px">' + hist + '</div>' : '') + '</form>';
  }).join('');
  return adminScreen(adminTop('Meds & notes', { eyebrow: 'Shared by both houses', colour: '#BE185D', shadow: '#9D174D' }) +
    '<p class="small muted" style="margin:0">Write what each kid currently takes. It shows on their Meds chore at both houses, and every change is kept below with the date and who made it.</p>' + cards);
}
function adminRestore() {
  const st = S.snaps || { loading: true };
  let body;
  if (st.loading) body = '<div class="empty">Looking in Dropbox…</div>';
  else if (st.error) body = '<div class="banner err">Couldn\'t list Dropbox backups: ' + h(st.error) + '</div>';
  else if (!st.list.length) body = '<div class="empty">No backups in Dropbox yet.</div>';
  else body = '<div class="col" style="gap:8px">' + st.list.slice(0, 80).map((e) => '<div class="list-row"><div class="grow col"><div style="font-weight:800">' + h(whenText(e.when)) + '</div><div class="small muted">' + h(e.kind) + ' · ' + Math.max(1, Math.round(e.size / 1024)) + ' KB</div></div><button type="button" class="btn" style="min-height:44px" data-act="restore-snap" data-path="' + h(e.path) + '" data-when="' + h(whenText(e.when)) + '">Use this</button></div>').join('') + '</div>';
  return adminScreen(adminTop('Restore', { eyebrow: 'From Dropbox', colour: '#475569', shadow: '#334155', back: 'settings' }) +
    '<p class="small muted" style="margin:0">Pick a copy to go back to. It replaces everything in Tidy Tribe for both houses. The current data is saved to Dropbox first.</p>' + body);
}
async function loadSnaps() {
  S.snaps = { loading: true }; render();
  try { S.snaps = { list: await B.listBackups() }; } catch (e) { S.snaps = { error: e.message || String(e) }; }
  render();
}

// ---------- shared view parts ----------
function avatar(k, cls) {
  const c = colourOf(k);
  return '<span class="avatar ' + (cls || '') + '" style="color:' + L.deepOf(c) + '">' + h(kidName(k)[0]) + '</span>';
}
function solidAvatar(k, cls) {
  return '<span class="avatar solid ' + (cls || '') + '" style="background:' + colourOf(k) + ';color:' + L.inkOn(colourOf(k)) + '">' + h(kidName(k)[0]) + '</span>';
}
// One day's chores for a kid: what was ticked (and when), what wasn't.
// "Not done" is worked out from the chores as they're set up now.
function viewKidDay(k, d) {
  const today = L.dateKey(new Date());
  if (!d) d = today;
  const isToday = d === today;
  const ticks = S.completions.filter((c) => c.kid === k && c.date === d).sort((a, b) => (a.at ? a.at.getTime() : 0) - (b.at ? b.at.getTime() : 0));
  const doneIds = new Set(ticks.map((c) => c.choreId));
  const pts = ticks.reduce((s2, c) => s2 + (c.pts || 0), 0);
  const fixed = S.chores.filter((c) => L.shareMode(c) !== 'turns');
  const due = L.choresFor(k, d, fixed, S.config);
  const missed = due.filter((c) => !c.optional && !doneIds.has(c.id));
  const optMissed = due.filter((c) => c.optional && !doneIds.has(c.id));
  const doneRows = ticks.map((c) => {
    const ch = S.chores.find((x) => x.id === c.choreId);
    const magic = c.choreId === 'magic';
    const late = !magic && ch && c.at && L.isLate(ch, c.at, d);
    return '<div class="list-row"><span class="pts-tile" style="background:' + (magic ? '#422006' : 'var(--green)') + ';width:40px;height:40px;font-size:14px">' + (magic ? starIco(20, '#FACC15') : ico('check', 20, 3)) + '</span><div class="grow col" style="gap:2px"><div style="font-weight:800">' + h(magic ? 'Magic button' : (c.choreName || (ch && ch.name) || 'Chore')) + '</div><div class="small muted">' + (c.at ? 'Ticked ' + L.fmtClock(c.at) : '') + (ch && !magic ? ' · due ' + L.fmtTime(ch.due) : '') + (late ? ' <span class="tag late">Late</span>' : '') + (c.house && c.house !== L.houseAt(k, L.keyToLocalMs(d, '12:00'), S.config) ? ' · ' + h(houseName(c.house)) : '') + '</div></div><div style="font-weight:800;color:#15803D">+' + (c.pts || 0) + '</div></div>';
  }).join('');
  const missRow = (c, opt) => '<div class="list-row" style="' + (opt ? 'opacity:.7' : '') + '"><span class="pts-tile" style="background:' + (opt ? '#94A3B8' : '#B91C1C') + ';width:40px;height:40px;font-size:14px">' + (opt ? '–' : '✕') + '</span><div class="grow col" style="gap:2px"><div style="font-weight:800">' + h(c.name) + '</div><div class="small muted">Due ' + L.fmtTime(c.due) + (opt ? ' · <span class="tag opt">Optional</span>' : '') + '</div></div><div class="small muted" style="font-weight:800;white-space:nowrap">' + c.pts + ' pts</div></div>';
  const here = L.houseAt(k, L.keyToLocalMs(d, '12:00'), S.config);
  return '<div class="screen"><header class="band" style="' + kidVars(k) + '"><div class="row"><button type="button" class="icon-btn" data-act="tab" data-tab="me" aria-label="Back">' + ico('back', 20, 2.2) + '</button><div class="grow col" style="gap:0"><div class="small" style="font-weight:800">' + h(kidName(k)) + ' · ' + h(houseName(here)) + '</div><h1 class="title-xl" style="font-size:28px">' + (isToday ? 'Today' : h(L.fmtKey(d))) + '</h1></div></div>' +
    '<div class="grid2"><div class="stat"><div class="lbl">' + ico('check', 16, 2.6) + 'Done</div><div class="num">' + ticks.filter((c) => c.choreId !== 'magic').length + '</div><div class="sub">+' + pts + ' pts</div></div><div class="stat dark"><div class="lbl">' + ico('clock', 16, 2.2) + (isToday ? 'Still to do' : 'Not done') + '</div><div class="num">' + missed.length + '</div><div class="sub">' + (optMissed.length ? '+ ' + optMissed.length + ' optional' : '&nbsp;') + '</div></div></div></header>' +
    '<div class="pad">' +
    '<h2 style="font-size:20px;color:#15803D">Done</h2><div class="col" style="gap:8px">' + (doneRows || '<div class="empty">Nothing ticked this day.</div>') + '</div>' +
    (missed.length ? '<h2 style="font-size:20px;color:#B91C1C">' + (isToday ? 'Still to do' : 'Not done') + '</h2><div class="col" style="gap:8px">' + missed.map((c) => missRow(c, false)).join('') + '</div>' : '') +
    (optMissed.length ? '<h2 style="font-size:20px;color:#475569">Optional — not done</h2><div class="col" style="gap:8px">' + optMissed.map((c) => missRow(c, true)).join('') + '</div>' : '') +
    '<p class="small muted" style="margin:0">Take-turns chores (bins, dishwasher) show here only on days they were done. "Not done" uses the chores as they\'re set up now.</p>' +
    '</div>' + kidNav('me') + '</div>';
}
function kidNav(tab) {
  const b = (id, label, icon) => '<button type="button" data-act="tab" data-tab="' + id + '" class="' + (tab === id ? 'on' : '') + '" aria-current="' + (tab === id ? 'page' : 'false') + '">' + ico(icon, 24, tab === id ? 2.2 : 2) + label + '</button>';
  return '<nav class="nav" aria-label="Kid menu">' + b('today', 'Today', 'tasks') + b('rewards', 'Rewards', 'gift') + b('me', 'Me', 'user') + '</nav>';
}
function backToPicker() {
  return isKidUser() ? '' : '<button type="button" class="icon-btn" data-act="go" data-screen="picker" aria-label="Switch person">' + ico('swap', 20, 2.2) + '</button>';
}
function demoBanner() {
  return S.store.mode === 'demo' ? '<div class="banner demo">Demo mode — saved on this phone only. Fill in firebase-config.js to share between phones.</div>' : '';
}

// ---------- screens ----------
function viewLogin() {
  const who = S.login.who;
  let body = '';
  if (!who) {
    body = '<div class="col" style="gap:12px">' + LOGIN_PEOPLE.map(([id, name]) =>
      '<button type="button" class="list-row btnlike" data-act="login-who" data-who="' + id + '"><span class="avatar sm solid" style="background:' + (ADULTS.includes(id) ? '#172033' : (SEED_CONFIG.kids[id] || {}).colour) + '">' + name[0] + '</span><span class="grow" style="font-weight:800;font-size:17px">' + name + '</span>' + ico('back', 20, 2.2).replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7') + '</button>').join('') + '</div>';
  } else {
    const name = LOGIN_PEOPLE.find((p) => p[0] === who)[1];
    body = '<form data-form="login" class="card line" autocomplete="on">' +
      '<div class="row"><span class="avatar sm solid" style="background:#172033">' + name[0] + '</span><div class="grow"><div class="title-lg">' + name + '</div><div class="small muted">' + h(who + '@tidytribe.app') + '</div></div></div>' +
      '<input type="hidden" name="username" value="' + h(who) + '" autocomplete="username">' +
      (S.store.mode === 'demo' ? '<p class="small muted" style="margin:0">Demo mode: any password works.</p>' : '') +
      '<div class="field"><label for="pw">Password</label><input class="input" id="pw" name="password" type="password" autocomplete="current-password" required></div>' +
      '<button class="btn primary big" type="submit">Sign in</button>' +
      '<button class="btn ghost" type="button" data-act="login-who" data-who="">Choose someone else</button></form>';
  }
  return '<div class="screen"><div class="top pad">' +
    '<div class="row"><span class="logo-mark"></span><div class="title-lg">Tidy Tribe</div></div>' +
    '<h1 class="title-xl">' + (who ? 'Enter password' : 'Whose phone is this?') + '</h1>' +
    '<p class="small muted" style="margin:0">You only need to do this once on each phone.</p>' +
    demoBanner() + body + '</div></div>';
}

function viewSetup() {
  if (!isAdultUser()) {
    return '<div class="screen"><div class="top pad"><span class="logo-mark big"></span><h1 class="title-xl">Almost ready</h1><p>An adult needs to set up Tidy Tribe first. Ask Dad to open the app on his phone.</p><button class="btn" data-act="signout">Sign out</button></div></div>';
  }
  return '<div class="screen"><div class="top pad"><span class="logo-mark big"></span><h1 class="title-xl">Welcome to Tidy Tribe</h1>' + demoBanner() +
    '<p style="margin:0;font-weight:700">This loads your family\'s starting chores (from S\'moresUp), the two rewards and the current points balances: Alex 45, Emma 721, Brooke 842. You can change anything later.</p>' +
    '<button class="btn primary big" data-act="setup">Set up Tidy Tribe</button></div></div>';
}

function viewPicker() {
  const dh = deviceHouse();
  const kids = dh ? L.kidsForHouse(dh, S.config) : Object.keys(S.config.kids);
  const nowMs = L.localMs(new Date());
  const shared = sharedKids();
  let custodyLine = '';
  if (shared.length) {
    const hs = L.houseAt(shared[0], nowMs, S.config);
    const nc = nextChange(shared[0], nowMs);
    custodyLine = '<div class="chipline">' + ico('house', 16, 2, '#FACC15') + h(shared.map(kidName).join(' & ')) + ' at ' + h(houseName(hs)) + (nc ? ' till ' + h(L.fmtLocalMs(nc.at).replace(/^(\w+) \d+ \w+, /, '$1 ')) : '') + '</div>';
  }
  const cards = kids.map((k) => {
    const here = L.houseAt(k, nowMs, S.config);
    const away = dh && here !== dh;
    const t = todayInfo(k);
    const left = t.total - t.done;
    const summary = away ? 'At ' + houseName(here) : (t.total ? (left ? left + ' chore' + (left === 1 ? '' : 's') + ' left today' : 'All done today!') : 'No chores today');
    return '<button type="button" class="kidcard" data-act="open-kid" data-kid="' + k + '" style="' + kidVars(k) + ';background:' + colourOf(k) + ';color:' + L.inkOn(colourOf(k)) + (away ? ';opacity:.7' : '') + '">' +
      avatar(k) + '<span class="grow col"><span style="font-family:var(--display);font-weight:600;font-size:24px">' + h(kidName(k)) + '</span><span class="small">' + h(summary) + '</span></span>' +
      '<span class="col" style="align-items:flex-end;gap:6px"><span class="pill white">' + coinIco(18) + points(k) + '</span><span class="pill navy">' + starIco(16) + starsThisYear(k).length + '</span></span></button>';
  }).join('');
  return '<div class="screen"><div class="top pad">' +
    '<div class="row"><span class="logo-mark"></span><div class="title-lg grow">Tidy Tribe</div></div>' +
    demoBanner() +
    '<h1 class="title-xl">Who\'s ticking chores?</h1>' + custodyLine +
    '<div class="col" style="gap:14px">' + cards + '</div>' +
    '<div class="grow"></div>' +
    '<button type="button" class="btn dark big full" data-act="go" data-screen="pin">' + ico('lock', 20, 2, '#FACC15') + 'Adults — enter PIN</button>' +
    '</div></div>';
}

function kidBand(k, t) {
  const here = L.houseAt(k, L.localMs(t.now), S.config);
  const pct = t.total ? Math.round(t.done / t.total * 100) : 0;
  return '<header class="band" style="' + kidVars(k) + '">' +
    '<div class="row">' + backToPicker() +
    '<div class="grow col" style="gap:0"><h1 class="title-xl" style="font-size:28px">Hi ' + h(kidName(k)) + '</h1><div class="row small" style="gap:6px">' + ico('house', 14, 2.2) + 'At ' + h(houseName(here)) + '</div></div>' + avatar(k) + '</div>' +
    '<div class="grid2"><div class="stat"><div class="lbl">' + coinIco(16) + 'Points</div><div class="num">' + points(k) + '</div><div class="sub">= ' + L.money(points(k), perDollar()) + '</div></div>' +
    '<div class="stat dark"><div class="lbl">' + starIco(16) + 'Above &amp; Beyond</div><div class="num">' + starsThisYear(k).length + '</div><div class="sub">' + sinceText() + '</div></div></div>' +
    (t.total ? '<div class="col" style="gap:6px"><div class="row small" style="justify-content:space-between;font-weight:800;font-size:14px"><span>Today: ' + t.done + ' of ' + t.total + ' done</span><span>+' + t.pts + ' pts</span></div><div class="bar" role="img" aria-label="' + pct + '% done"><i style="width:' + pct + '%"></i></div></div>' : '') +
    '</header>';
}

function viewKidToday(k) {
  const t = todayInfo(k);
  if (S.config.kids[k].simple) return viewSimpleToday(k, t);
  let body = '';
  body = magicCard(k, t);
  if (!t.total) {
    body = '<div class="empty">No chores for today at ' + h(houseName(L.houseAt(k, L.localMs(t.now), S.config))) + '. Enjoy!</div>';
  }
  for (const p of L.PARTS) {
    const items = t.list.filter((c) => L.partOf(c.due).id === p.id);
    if (!items.length) continue;
    body += partHead(p, items, k, t, 21);
    for (const ch of items) body += choreRow(k, ch, t, groupOf(ch));
    body += '</section>';
  }
  return '<div class="screen">' + kidBand(k, t) + '<div class="pad">' + body + '</div>' + kidNav('today') + '</div>';
}
function partHead(p, items, k, t, size) {
  const doneN = items.filter((c) => t.cm[L.completionId(k, t.key, c.id)]).length;
  return '<section class="col" style="gap:' + (size > 21 ? 12 : 10) + 'px"><div class="group-head"><span class="group-ico" style="background:' + p.colour + '">' + ico(p.icon, 20, 2.2) + '</span><h2 style="font-size:' + size + 'px;color:' + p.colour + '">' + p.name + '</h2><span class="grow"></span><span class="count-pill" style="background:' + p.light + ';color:' + p.colour + '">' + doneN + ' of ' + items.length + '</span></div>';
}
function isMedsChore(ch) { return choreIcon(ch.name) === 'pill'; }
function choreNotes(k, ch) {
  let out = '';
  const m = S.meds[k];
  if (isMedsChore(ch) && m && m.current) out += '<div class="note-line">' + ico('pill', 15, 2.2) + '<span>' + h(m.current) + '</span></div>';
  if (ch.note) out += '<div class="note-line plain">' + h(ch.note) + '</div>';
  return out;
}
function choreRow(k, ch, t, g) {
  const c = t.cm[L.completionId(k, t.key, ch.id)];
  const done = !!c;
  const late = done && c.at && L.isLate(ch, c.at, t.key);
  const share = done ? '' : shareText(ch, k);
  const meta = (done ? 'Done ' + L.fmtClock(c.at) + ' · due ' + L.fmtTime(ch.due) : 'Due ' + L.fmtTime(ch.due)) +
    (late ? ' <span class="tag late">Late</span>' : '') +
    (ch.optional ? ' <span class="tag opt">Optional</span>' : '') +
    (share ? ' <span class="tag turn">' + h(share) + '</span>' : '');
  const locked = done && !isAdultUser() && c.undoUntil && c.undoUntil <= t.now;
  return '<div class="chore' + (done ? ' done' : '') + '" style="box-shadow:0 3px 0 ' + g.light + ';border-color:' + (done ? '' : g.light) + '">' +
    '<span class="pts-tile" style="background:' + (done ? 'var(--green)' : g.colour) + '">+' + ch.pts + '</span>' +
    '<div class="grow col"><div class="chore-name">' + h(ch.name) + '</div>' + choreNotes(k, ch) + '<div class="meta">' + meta + '</div></div>' +
    '<button type="button" class="tick' + (done ? ' on' : '') + (locked ? ' locked' : '') + '" data-act="tick" data-kid="' + k + '" data-chore="' + h(ch.id) + '" aria-label="' + (done ? 'Undo ' : 'Mark done: ') + h(ch.name) + '" aria-pressed="' + done + '">' + (done ? ico('check', 24, 3.2) : '') + '</button></div>';
}
function viewSimpleToday(k, t) {
  let body = '';
  body = magicCard(k, t);
  if (!t.total) body = '<div class="empty">No jobs today!</div>';
  let i = 0;
  for (const p of L.PARTS) {
    const items = t.list.filter((c) => L.partOf(c.due).id === p.id);
    if (!items.length) continue;
    body += partHead(p, items, k, t, 24) + '<div class="tiles">';
    for (const ch of items) {
      const done = !!t.cm[L.completionId(k, t.key, ch.id)];
      body += '<button type="button" class="tile' + (done ? ' done' : '') + '" style="background:' + TILE_COLOURS[i++ % TILE_COLOURS.length] + '" data-act="tick" data-kid="' + k + '" data-chore="' + h(ch.id) + '" aria-pressed="' + done + '" aria-label="' + h(ch.name) + ', ' + ch.pts + ' points' + (done ? ', done' : '') + '">' + '<span class="pts">' + coinIco(18) + '+' + ch.pts + '</span>' + ico(choreIcon(ch.name), 52, 1.8) + '<span>' + h(ch.name) + '</span>' + (done ? '<span class="badge">' + ico('check', 22, 3.2) + '</span>' : '') + '</button>';
    }
    body += '</div></section>';
  }
  const head = '<header class="band" style="' + kidVars(k) + '"><div class="row">' + backToPicker() + avatar(k) + '<h1 class="title-xl grow">' + h(kidName(k)) + '</h1></div>' +
    '<div class="grid2"><div class="stat row" style="flex-direction:row;align-items:center;gap:10px">' + coinIco(36) + '<span class="num">' + points(k) + '</span></div><div class="stat dark row" style="flex-direction:row;align-items:center;gap:10px">' + starIco(36) + '<span class="num" style="color:#FACC15">' + starsThisYear(k).length + '</span></div></div></header>';
  return '<div class="screen">' + head + '<div class="pad">' + body + '</div>' + kidNav('today') + '</div>';
}

function viewKidRewards(k) {
  const pend = pendingFor(k);
  const lot = S.config.cashOutLot || 1000;
  const av = available(k);
  const shelf = S.rewards.filter((r) => r.active !== false).sort((a, b) => a.pts - b.pts).map((r, i) => {
    const [bg, sh] = REWARD_COLOURS[i % REWARD_COLOURS.length];
    const need = r.pts - av;
    return '<div class="reward" style="background:' + bg + ';box-shadow:0 5px 0 ' + sh + '"><span class="ico">' + ico(r.icon || 'gift', 42, 1.8, bg) + '</span><div style="font-family:var(--display);font-weight:600;font-size:19px">' + h(r.name) + '</div><span class="price">' + r.pts + ' pts</span>' +
      '<button type="button" class="btn" data-act="request" data-kid="' + k + '" data-reward="' + h(r.id) + '"' + (need > 0 ? ' disabled' : '') + '>' + (need > 0 ? 'Need ' + need + ' more' : 'Request') + '</button></div>';
  }).join('') || '<div class="empty" style="grid-column:1/-1">No rewards on the shelf yet.</div>';
  const pendHtml = pend.map((r) => '<div class="pending"><span class="group-ico" style="background:#B45309;width:48px;height:48px;border-radius:16px">' + ico('clock', 24, 2.2) + '</span><div class="grow col"><div style="font-weight:800;font-size:16px">' + h(r.title) + ' · ' + r.pts + ' pts</div><div class="small" style="color:#78350F">Waiting for an adult at ' + h(houseName(r.house)) + '</div></div><button type="button" class="btn" style="min-height:44px;border-color:#B45309;color:#78350F" data-act="cancel-req" data-id="' + h(r.id) + '">Cancel</button></div>').join('');
  const recent = S.reqRecent.filter((r) => r.kid === k && r.status !== 'pending').slice(0, 5).map((r) =>
    '<div class="list-row"><div class="grow col"><div style="font-weight:800">' + h(r.title) + '</div><div class="small muted">' + (r.status === 'approved' ? 'Approved' + (r.type === 'cashout' && r.paidBy ? ' · paid by ' + h(houseName(r.paidBy)) : '') : r.status === 'declined' ? 'Declined' : 'Cancelled') + (r.closedAt ? ' · ' + L.fmtKey(L.dateKey(r.closedAt)) : '') + '</div></div><div style="font-weight:800;color:' + (r.status === 'approved' ? '#B91C1C' : 'var(--muted)') + '">' + (r.status === 'approved' ? '−' : '') + r.pts + '</div></div>').join('');
  const pctLot = Math.max(0, Math.min(100, Math.round(av / lot * 100)));
  return '<div class="screen"><header class="band pink"><div class="row">' + ico('gift', 30, 2) + '<h1 class="title-xl grow">Rewards</h1>' + backToPicker() + '</div>' +
    '<div class="grid2"><div class="stat"><div class="lbl">' + coinIco(16) + 'Can spend</div><div class="num">' + av + '</div><div class="sub">= ' + L.money(av, perDollar()) + '</div></div>' +
    '<div class="stat" style="background:rgba(255,255,255,.18);color:#fff"><div class="lbl" style="color:#fff">On hold</div><div class="num">' + heldFor(k) + '</div><div class="small">waiting for approval</div></div></div></header>' +
    '<div class="pad">' + pendHtml +
    '<h2 style="font-size:22px;color:#DB2777">Reward shelf</h2><div class="shelf">' + shelf + '</div>' +
    '<h2 style="font-size:22px;color:#15803D">Cash out</h2><div class="card" style="border:2px solid #BBF7D0;box-shadow:0 4px 0 #BBF7D0">' +
    '<div class="row" style="justify-content:space-between"><div class="title-lg" style="font-size:20px">' + L.money(lot, perDollar()) + ' = ' + lot.toLocaleString('en-AU') + ' pts</div><div class="small" style="color:#15803D;font-weight:800">' + (av >= lot ? 'Ready!' : (lot - av) + ' to go') + '</div></div>' +
    '<div class="bar grey" style="height:16px;background:#DCFCE7" role="img" aria-label="' + pctLot + '% of the way"><i style="width:' + pctLot + '%;background:#16A34A"></i></div>' +
    '<button type="button" class="btn green" data-act="cashout" data-kid="' + k + '"' + (av < lot ? ' disabled' : '') + '>Cash out ' + L.money(lot, perDollar()) + '</button>' +
    '<div class="small muted">Paid by the adults at the house that approves it.</div></div>' +
    (recent ? '<h2 style="font-size:20px">Recent</h2><div class="col" style="gap:8px">' + recent + '</div>' : '') +
    '</div>' + kidNav('rewards') + '</div>';
}

function viewKidMe(k) {
  const per = curPeriod();
  const mine = starsThisYear(k);
  // One bar per month from the start of this tally (last 12 months at most)
  const nowKey = L.dateKey(new Date());
  const months = [];
  let y = Number(per.start.slice(0, 4)); let m = Number(per.start.slice(5, 7));
  const ty = Number(nowKey.slice(0, 4)); const tm = Number(nowKey.slice(5, 7));
  while (y < ty || (y === ty && m <= tm)) { months.push(y + '-' + String(m).padStart(2, '0')); m++; if (m > 12) { m = 1; y++; } }
  const shown = months.slice(-12);
  const counts = shown.map((mk) => mine.filter((st) => (st.date || '').slice(0, 7) === mk).length);
  const max = Math.max(1, ...counts);
  const bars = counts.map((c) => '<i class="' + (c ? 'on' : '') + '" style="height:' + (c ? Math.max(8, Math.round(c / max * 64)) : 4) + 'px"></i>').join('');
  const labels = shown.map((mk) => '<span>' + 'JFMAMJJASOND'[Number(mk.slice(5, 7)) - 1] + '</span>').join('');
  const past = pastTallies(k);
  const moments = mine.slice(0, 10).map((s) => '<div class="list-row" style="border:2px solid #FDE68A;box-shadow:0 3px 0 #FDE68A;border-radius:20px"><span class="group-ico" style="background:#FACC15;width:44px;height:44px;border-radius:14px">' + starIco(24, '#172033') + '</span><div class="grow col"><div style="font-weight:800;font-size:16px">' + h(s.what) + '</div>' + (s.note ? '<div class="small">' + h(s.note) + '</div>' : '') + '<div class="small muted">' + h(houseName(s.house)) + ' · ' + L.fmtKey(s.date) + ' · from ' + h(adultName(s.by)) + '</div></div></div>').join('') || '<div class="empty">No Above &amp; Beyond moments yet this time.</div>';
  // Points earned per day this week
  const today = L.dateKey(new Date());
  const wk = L.weekStart(today);
  const earned = S.completions.filter((c) => c.kid === k && c.date >= wk && c.date <= today).reduce((s2, c) => s2 + (c.pts || 0), 0);
  const maxWk = weeklyMax(k);
  const pctWk = maxWk ? Math.min(100, Math.round(earned / maxWk * 100)) : 0;
  const weekCard = maxWk ? '<div class="card" style="border:2px solid #BFDBFE;box-shadow:0 4px 0 #BFDBFE"><div class="row" style="justify-content:space-between;align-items:baseline"><div class="lbl">This week (since Monday)</div><div style="font-family:var(--display);font-weight:600;font-size:24px">' + earned + ' <span class="small muted">of about ' + maxWk + '</span></div></div><div class="bar grey" style="height:14px"><i style="width:' + pctWk + '%;background:' + colourOf(k) + '"></i></div><div class="small muted">' + maxWk + ' is the most you can get in a week if you do every chore' + (magicOn(k) ? ' and tap the Magic button each night' : '') + '.</div></div>' : '';
  let week = '';
  const nDays = S.moreDays ? 24 : 7;
  for (let i = 0; i < nDays; i++) {
    const d = L.addDays(today, -i);
    const pts = S.completions.filter((c) => c.kid === k && c.date === d).reduce((s, c) => s + (c.pts || 0), 0);
    const n = S.completions.filter((c) => c.kid === k && c.date === d && c.choreId !== 'magic').length;
    week += '<button type="button" class="list-row btnlike" data-act="day" data-kid="' + k + '" data-date="' + d + '"><div class="grow" style="font-weight:800">' + (i === 0 ? 'Today' : L.fmtKey(d)) + '</div><div class="small muted">' + n + ' chore' + (n === 1 ? '' : 's') + '</div><div style="font-weight:800;color:#9A3412;min-width:56px;text-align:right">+' + pts + '</div>' + ico('back', 18, 2.4).replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7') + '</button>';
  }
  const sw = L.KID_COLOURS.map((c) => '<button type="button" class="swatch' + (colourOf(k) === c ? ' on' : '') + '" style="background:' + c + '" data-act="colour" data-kid="' + k + '" data-colour="' + c + '" aria-label="' + h(L.colourName(c)) + '" title="' + h(L.colourName(c)) + '" aria-pressed="' + (colourOf(k) === c) + '"></button>').join('');
  return '<div class="screen"><header class="band" style="' + kidVars(k) + '"><div class="row">' + backToPicker() + '<span class="avatar" style="width:64px;height:64px;border-radius:22px;font-size:30px;color:' + L.deepOf(colourOf(k)) + '">' + h(kidName(k)[0]) + '</span><div class="grow col"><h1 class="title-xl">' + h(kidName(k)) + '</h1><div class="small">' + points(k) + ' pts · ' + L.money(points(k), perDollar()) + '</div></div></div></header>' +
    '<div class="pad">' +
    '<div class="card" style="background:#172033;color:#fff;box-shadow:0 6px 0 #FACC15;border-radius:26px;padding:20px;gap:16px">' +
    '<div class="row" style="gap:14px">' + starIco(64) + '<div class="col" style="gap:0"><div class="eyebrow" style="color:#FACC15">Above &amp; Beyond · ' + sinceText() + '</div><div style="font-family:var(--display);font-weight:600;font-size:48px;line-height:1">' + mine.length + '</div><div class="small" style="color:#C9D1E3">times so far</div></div></div>' +
    '<div class="col" style="gap:6px"><div class="months" role="img" aria-label="Above and Beyond by month">' + bars + '</div><div class="mlabels" aria-hidden="true">' + labels + '</div></div>' +
    (past.length ? '<div class="small" style="color:#C9D1E3">Past tallies: ' + past.map((t) => h(t.label) + ' — ' + t.n).join(' · ') + '</div>' : '<div class="small" style="color:#C9D1E3">Counted separately from points. Each tally\'s total stays in your profile.</div>') +
    '</div>' +
    penaltyKidCards(k) + weekCard + magicHistory(k) +
    '<h2 style="font-size:22px;color:' + L.deepOf(colourOf(k)) + '">Recent moments</h2><div class="col" style="gap:10px">' + moments + '</div>' +
    '<h2 style="font-size:22px">My colour</h2><div class="swatches">' + sw + '</div>' +
    '<h2 style="font-size:22px">Day by day</h2><p class="small muted" style="margin:-8px 0 0">Tap a day to see which chores were done.</p><div class="col" style="gap:8px">' + week + '</div>' +
    (S.moreDays ? '' : '<button type="button" class="btn ghost" data-act="more-days">Show older days</button>') +
    (isKidUser() ? '<button type="button" class="btn ghost-red" data-act="signout">Sign out of this phone</button>' : '') +
    '<p class="small muted center" style="margin:0">Tidy Tribe v' + VERSION + '</p>' +
    '</div>' + kidNav('me') + '</div>';
}

// ---------- PIN ----------
function viewPin() {
  const p = S.pin;
  const adults = ADULTS.filter((a) => (S.config.pins || {})[a] || a === S.user);
  const creating = p.stage !== 'enter';
  const title = p.stage === 'create1' ? 'Create your PIN' : p.stage === 'create2' ? 'Type it again' : 'Adult access';
  const dots = [0, 1, 2, 3].map((i) => '<i class="' + (p.entry.length > i ? 'on' : '') + '"></i>').join('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => k === '' ? '<span></span>' : k === 'del' ? '<button type="button" class="txt" data-act="pin" data-k="del">Delete</button>' : '<button type="button" data-act="pin" data-k="' + k + '" aria-label="' + k + '">' + k + '</button>').join('');
  return '<div class="screen" style="background:#172033;color:#fff"><div class="top pad" style="align-items:center;gap:22px">' +
    '<span class="group-ico" style="background:#2A3550;width:56px;height:56px;border-radius:18px">' + ico('lock', 28, 2) + '</span>' +
    '<h1 class="title-xl">' + title + '</h1>' +
    (creating ? '<p class="small center" style="margin:0;color:#C9D1E3">4 digits, just for ' + h(adultName(p.adult)) + '. Keep it secret from the kids.</p>' :
      '<div class="chips" style="justify-content:center">' + adults.map((a) => '<button type="button" class="chip' + (a === p.adult ? ' on' : '') + '" style="' + (a === p.adult ? 'background:#fff;color:#172033;border-color:#fff' : 'background:transparent;color:#fff;border-color:#44507A;box-shadow:none') + '" data-act="pin-adult" data-adult="' + a + '" aria-pressed="' + (a === p.adult) + '">' + h(adultName(a)) + '</button>').join('') + '</div>') +
    '<div class="dots" role="img" aria-label="' + p.entry.length + ' of 4 digits">' + dots + '</div>' +
    (p.msg ? '<div class="small" style="color:#FCA5A5;font-weight:800">' + h(p.msg) + '</div>' : '') +
    '<div class="pinpad">' + keys + '</div>' +
    '<button type="button" class="btn ghost" style="color:#C9D1E3" data-act="pin-cancel">Cancel</button></div></div>';
}
async function pinKey(k) {
  const p = S.pin;
  p.msg = '';
  if (k === 'del') { p.entry = p.entry.slice(0, -1); render(); return; }
  if (p.entry.length >= 4) return;
  p.entry += k;
  render();
  if (p.entry.length < 4) return;
  const entry = p.entry;
  if (p.stage === 'create1') { p.first = entry; p.entry = ''; p.stage = 'create2'; render(); return; }
  if (p.stage === 'create2') {
    if (entry !== p.first) { p.entry = ''; p.stage = 'create1'; p.msg = 'They did not match — try again.'; render(); return; }
    const hash = await pinHash(p.adult, entry);
    write([{ op: 'update', path: 'config/main', data: { ['pins.' + p.adult]: hash } }], 'PIN saved');
    startAdmin(p.adult);
    return;
  }
  const hash = await pinHash(p.adult, entry);
  if ((S.config.pins || {})[p.adult] === hash) startAdmin(p.adult);
  else { p.entry = ''; p.msg = 'Wrong PIN'; render(); }
}
function openPin() {
  const pins = S.config.pins || {};
  const adult = isAdultUser() ? S.user : ADULTS.find((a) => pins[a]);
  if (!adult) { toast('No adult PIN set yet.', true); return; }
  S.pin = { adult, entry: '', stage: pins[adult] ? 'enter' : 'create1', first: '', msg: '' };
  S.view = { screen: 'pin' };
  render();
}
function startAdmin(adult) {
  S.admin = { as: adult, until: Date.now() + ADMIN_MINUTES * 60000 };
  S.pin = null;
  S.view = { screen: 'admin', sub: 'home' };
  render();
}

// ---------- admin ----------
function adminTop(title, opts) {
  const o = opts || {};
  return '<div class="row" style="background:' + (o.colour || '#172033') + ';color:' + (o.ink || '#fff') + ';border-radius:24px;padding:14px;box-shadow:0 5px 0 ' + (o.shadow || '#0B1222') + '">' +
    '<button type="button" class="icon-btn" ' + (o.ink ? 'style="background:rgba(66,32,6,.12);color:' + o.ink + '"' : '') + ' data-act="admin" data-sub="' + (o.back || 'home') + '" aria-label="Back">' + ico('back', 20, 2.2) + '</button>' +
    '<div class="grow col" style="gap:0">' + (o.eyebrow ? '<div class="eyebrow">' + h(o.eyebrow) + '</div>' : '') + '<h1 style="font-size:26px">' + h(title) + '</h1></div>' + (o.right || '') + '</div>';
}
function adminScreen(inner) {
  return '<div class="screen cool"><div class="top pad">' + inner + '</div></div>';
}
function viewAdmin() {
  if (!adminOn()) { S.admin = null; S.view = { screen: 'picker' }; return isKidUser() ? viewKid() : viewPicker(); }
  const sub = S.view.sub || 'home';
  const fn = { home: adminHome, ab: adminAB, chores: adminChores, chore: adminChoreEdit, copy: adminCopy, other: adminOther, rewards: adminRewards, reward: adminRewardEdit, schedule: adminSchedule, balances: adminBalances, people: adminPeople, settings: adminSettings, restore: adminRestore, meds: adminMeds }[sub] || adminHome;
  return fn();
}
function adminHome() {
  const house = adminHouse();
  const nowMs = L.localMs(new Date());
  const shared = sharedKids();
  let custody = '';
  if (shared.length) {
    const hs = L.houseAt(shared[0], nowMs, S.config);
    const nc = nextChange(shared[0], nowMs);
    custody = '<div class="row" style="background:#2A3550;border-radius:16px;padding:12px 14px;gap:10px">' + ico('cal', 24, 2, '#FACC15') + '<div class="col" style="gap:2px"><div style="font-weight:800;font-size:15px">' + h(shared.map(kidName).join(' & ')) + ' at ' + h(houseName(hs)) + (nc ? ' until ' + h(L.fmtLocalMs(nc.at)) : '') + '</div><div class="small" style="color:#C9D1E3">' + (nc ? 'Then ' + h(houseName(nc.to)) : '') + Object.keys(S.config.kids).filter((k) => S.config.kids[k].custody !== 'shared' && S.config.kids[k].house === house).map((k) => ' · ' + h(kidName(k)) + ' always here').join('') + '</div></div></div>';
  }
  const pend = S.reqPending.filter((r) => r.status === 'pending' && r.house === house);
  const pendHtml = pend.length ? pend.map((r) => '<div class="card" style="box-shadow:0 4px 0 ' + colourOf(r.kid) + '33"><div class="row">' + solidAvatar(r.kid, 'sm') + '<div class="grow col"><div style="font-weight:800;font-size:16px">' + h(kidName(r.kid)) + ' · ' + h(r.title) + '</div><div class="small muted">' + r.pts + ' pts on hold · has ' + points(r.kid) + ' · asked ' + (r.createdAt ? L.fmtClock(r.createdAt) + ' ' + L.fmtKey(L.dateKey(r.createdAt)) : '') + '</div></div></div><div class="grid2"><button type="button" class="btn danger" data-act="decide" data-id="' + h(r.id) + '" data-ok="0">Decline</button><button type="button" class="btn green" data-act="decide" data-id="' + h(r.id) + '" data-ok="1">Approve</button></div></div>').join('') : '<div class="empty">Nothing waiting.</div>';
  const kids = L.kidsForHouse(house, S.config).filter((k) => L.houseAt(k, nowMs, S.config) === house);
  const prog = kids.map((k) => {
    const t = todayInfo(k);
    const pct = t.total ? Math.round(t.done / t.total * 100) : 0;
    const late = t.list.filter((ch) => { const c = t.cm[L.completionId(k, t.key, ch.id)]; return c && L.isLate(ch, c.at, t.key); }).length;
    return '<button type="button" class="list-row" data-act="open-kid" data-kid="' + k + '">' + solidAvatar(k, 'sm') + '<div class="grow col" style="gap:6px"><div class="row" style="justify-content:space-between;font-size:14px;font-weight:800"><span>' + h(kidName(k)) + '</span><span class="muted">' + t.done + ' of ' + t.total + (late ? ' · ' + late + ' late' : '') + '</span></div><div class="bar grey"><i style="width:' + pct + '%;background:' + colourOf(k) + '"></i></div></div></button>';
  }).join('') || '<div class="empty">No kids at ' + h(houseName(house)) + ' right now.</div>';
  const tile = (sub, label, icon, bg) => '<button type="button" class="manage" style="background:' + bg + '" data-act="admin" data-sub="' + sub + '">' + ico(icon, 28, 2) + label + '</button>';
  return '<div class="screen cool"><header class="band navy"><div class="row"><div class="grow col" style="gap:0"><div class="eyebrow" style="color:#FACC15">Admin · ' + h(adultName(S.admin.as)) + '</div><h1 class="title-xl">' + h(houseName(house)) + '</h1></div><button type="button" class="btn" style="background:#2A3550;color:#fff;border-color:#2A3550;min-height:44px" data-act="lock">' + ico('lock', 16, 2) + 'Lock</button></div>' + custody +
    '<button type="button" class="btn gold" data-act="admin" data-sub="ab">' + starIco(30, '#422006') + 'Above and Beyond</button></header>' +
    '<div class="pad">' + demoBanner() +
    '<section class="col" style="gap:10px"><div class="row" style="gap:8px"><h2 style="font-size:21px">Waiting for you</h2>' + (pend.length ? '<span style="background:#DC2626;color:#fff;border-radius:999px;padding:2px 10px;font-weight:800;font-size:14px">' + pend.length + '</span>' : '') + '</div>' + pendHtml + '</section>' +
    '<section class="col" style="gap:10px"><h2 style="font-size:21px">Today</h2>' + prog + '</section>' +
    '<section class="col" style="gap:10px"><h2 style="font-size:21px">Manage</h2><div class="grid3">' +
    tile('chores', 'Chores', 'tasks', '#1D4ED8') + tile('rewards', 'Rewards', 'gift', '#DB2777') + tile('schedule', 'Schedule', 'cal', '#4F46E5') +
    tile('balances', 'Balances', 'dollar', '#15803D') + tile('people', 'People &amp; PINs', 'people', '#0F766E') + tile('settings', 'Settings', 'gear', '#475569') + tile('meds', 'Meds &amp; notes', 'pill', '#BE185D') +
    '</div></section></div></div>';
}

function adminAB() {
  const house = adminHouse();
  const nowMs = L.localMs(new Date());
  const kids = L.kidsForHouse(house, S.config).filter((k) => L.houseAt(k, nowMs, S.config) === house);
  const f = S.form.ab || (S.form.ab = { kids: [], what: '' });
  const picks = kids.map((k) => '<button type="button" class="pick' + (f.kids.includes(k) ? ' on' : '') + '" style="--c:' + colourOf(k) + ';--c-ink:' + L.inkOn(colourOf(k)) + '" data-act="ab-kid" data-kid="' + k + '" aria-pressed="' + f.kids.includes(k) + '"><span class="avatar sm ' + (f.kids.includes(k) ? '' : 'solid') + '" style="' + (f.kids.includes(k) ? 'color:' + L.deepOf(colourOf(k)) : 'background:' + colourOf(k) + ';color:' + L.inkOn(colourOf(k))) + '">' + h(kidName(k)[0]) + '</span>' + h(kidName(k)) + '</button>').join('') || '<div class="empty" style="grid-column:1/-1">No kids here right now.</div>';
  const presets = (S.config.abPresets || []).map((p) => '<button type="button" class="chip' + (f.what === p ? ' on' : '') + '" data-act="ab-what" data-what="' + h(p) + '" aria-pressed="' + (f.what === p) + '">' + h(p) + '</button>').join('');
  const names = f.kids.map(kidName);
  const btnLabel = names.length === 0 ? 'Pick who first' : 'Give ' + (names.length === 1 ? names[0] : names.length + ' kids') + ' a star';
  const recent = S.stars.filter((s) => s.house === house && starPeriodOf(s) === curPeriod().id).slice(0, 8).map((s) => '<div class="list-row">' + solidAvatar(s.kid, 'sm') + '<div class="grow col"><div style="font-weight:800">' + h(s.what) + '</div><div class="small muted">' + h(kidName(s.kid)) + ' · ' + L.fmtKey(s.date) + ' · ' + h(adultName(s.by)) + '</div></div><button type="button" class="icon-btn light" data-act="ab-del" data-id="' + h(s.id) + '" aria-label="Remove this star">' + ico('trash', 18, 2) + '</button></div>').join('');
  return '<div class="screen"><header class="band gold"><button type="button" class="icon-btn dark" data-act="admin" data-sub="home" aria-label="Back">' + ico('back', 20, 2.2) + '</button><div class="row">' + starIco(48, '#422006') + '<div class="col" style="gap:0"><h1 class="title-xl">Above and Beyond</h1><div style="font-size:14px;font-weight:800">Recognise something great</div></div></div></header>' +
    '<form class="pad" data-form="ab">' +
    '<section class="col" style="gap:10px"><h2 style="font-size:20px">1. Who?</h2><div class="grid3">' + picks + '</div><div class="small muted">Pick more than one if they did it together.</div></section>' +
    '<section class="col" style="gap:10px"><h2 style="font-size:20px">2. What did they do?</h2><div class="chips">' + presets + '</div></section>' +
    '<section class="card" style="border:2px dashed #CA8A04"><div class="field"><label for="ab-other">Something else?</label><input class="input" id="ab-other" name="other" type="text" maxlength="80" placeholder="e.g. Helped a neighbour with shopping" value="' + h(f.other || '') + '"></div><label class="check"><input type="checkbox" name="save" checked><span style="font-weight:800">Save to the list for next time</span></label></section>' +
    '<div class="field"><label for="ab-note">3. Note (optional)</label><input class="input" id="ab-note" name="note" type="text" maxlength="140" value="' + h(f.note || '') + '"></div>' +
    (names.length ? '<button type="submit" class="btn dark big" style="min-height:64px;border-radius:20px;color:#FACC15;font-family:var(--display);font-weight:600;font-size:21px;box-shadow:0 5px 0 #CA8A04">' + starIco(26) + h(btnLabel) + '</button>' : '<button type="submit" class="btn big" disabled style="min-height:64px;border-radius:20px;font-family:var(--display);font-weight:600;font-size:21px">' + h(btnLabel) + '</button>') +
    (recent ? '<h2 style="font-size:20px">Recently given here</h2><div class="col" style="gap:8px">' + recent + '</div>' : '') +
    '</form></div>';
}
function submitAB(fd) {
  const f = S.form.ab;
  const other = (fd.get('other') || '').toString().trim();
  const what = other || f.what;
  if (!f.kids.length) { toast('Pick who first', true); return; }
  if (!what) { toast('Pick what they did, or type something', true); return; }
  touchAdmin();
  const now = new Date();
  const key = L.dateKey(now);
  const year = key.slice(0, 4);
  const period = curPeriod().id;
  const house = adminHouse();
  const ops = [];
  for (const k of f.kids) {
    ops.push({ op: 'set', path: 'stars/' + rid('star'), data: { kid: k, what, note: (fd.get('note') || '').toString().trim(), by: S.admin.as, house, at: now, date: key, year, period } });
    ops.push({ op: 'update', path: 'balances/' + k, data: { ['stars.' + period]: inc(1) } });
  }
  if (other && fd.get('save') && !(S.config.abPresets || []).includes(other)) {
    ops.push({ op: 'update', path: 'config/main', data: { abPresets: (S.config.abPresets || []).concat([other]) } });
  }
  write(ops, starsMsg(f.kids));
  S.form.ab = { kids: [], what: '' };
  render();
}
function starsMsg(kids) { return 'Star given to ' + kids.map(kidName).join(' & ') + '!'; }

// Chores from other houses this adult may see: only the kids who also stay at their house
// (so Heidi never sees Brooke-only chores, and Brooke's name is left off shared ones).
function otherHouseChores(house) {
  const allowed = L.kidsForHouse(house, S.config);
  return S.chores.filter((c) => c.house !== house)
    .map((c) => Object.assign({}, c, { kids: c.kids.filter((k) => allowed.includes(k)) }))
    .filter((c) => c.kids.length);
}
function choreRowsByTime(list, rowFn) {
  let body = '';
  for (const p of L.PARTS) {
    const items = list.filter((c) => L.partOf(c.due).id === p.id).sort(L.byTime);
    if (!items.length) continue;
    body += '<h2 style="font-size:19px;color:' + p.colour + '">' + p.name + '</h2><div class="col" style="gap:8px">' + items.map(rowFn).join('') + '</div>';
  }
  return body;
}
function choreSummary(c) {
  const g = groupOf(c);
  const mode = L.shareMode(c);
  const turn = S.turns[c.id] && S.turns[c.id].kid;
  const shareTxt = mode === 'daily' ? ' · swaps daily (' + kidName(L.dailyWho(c, L.dateKey(new Date()))) + ' today)' : mode === 'turns' ? ' · takes turns' + (turn && c.kids.includes(turn) ? ' (' + kidName(turn) + '\'s turn)' : '') : '';
  return '<span class="pts-tile" style="background:' + g.colour + ';width:44px;height:44px;font-size:16px">' + c.pts + '</span><div class="grow col"><div style="font-weight:800">' + h(c.name) + '</div><div class="small muted">' + L.fmtTime(c.due) + ' · ' + h(g.name) + ' · ' + h(c.kids.map(kidName).join(', ')) + h(shareTxt) + (c.schoolOnly ? ' · school days' : '') + (c.schoolNext ? ' · night before school' : '') + (c.optional ? ' · optional' : '') + (c.active === false ? ' · paused' : '') + '</div>' + (c.note ? '<div class="small" style="color:#334155">' + h(c.note) + '</div>' : '') + '</div>';
}
function adminChores() {
  const house = choreHouse();
  const mine = S.chores.filter((c) => c.house === house);
  let body = choreRowsByTime(mine, (c) => '<button type="button" class="list-row btnlike" data-act="edit-chore" data-id="' + h(c.id) + '"' + (c.active === false ? ' style="opacity:.6"' : '') + '>' + choreSummary(c) + '</button>');
  if (!body) body = '<div class="empty">No chores at ' + h(houseName(house)) + ' yet. Add one, or copy chores from the other house.</div>';
  const otherHouses = Object.keys(S.config.houses).filter((x) => x !== house);
  const views = isOwner()
    ? '<div class="grid2">' + Object.keys(S.config.houses).map((x) => '<button type="button" class="btn' + (x === house ? ' dark' : '') + '" data-act="chore-house" data-house="' + h(x) + '" aria-pressed="' + (x === house) + '">' + ico('house', 18, 2) + h(houseName(x)) + '</button>').join('') + '</div><div class="small muted" style="margin-top:-8px">Owner: you can change chores at both houses.</div>'
    : otherHouses.map((x) => '<button type="button" class="btn full" style="border-color:#C7D2FE;color:#3730A3" data-act="other-house" data-house="' + h(x) + '">' + ico('house', 18, 2) + 'See ' + h(houseName(x)) + ' chores</button>').join('');
  return adminScreen(adminTop('Chores', { eyebrow: houseName(house), colour: '#1D4ED8', shadow: '#1E3A8A' }) +
    views + fairCard(house) +
    '<div class="grid2"><button type="button" class="btn primary" data-act="edit-chore" data-id="">' + ico('plus', 18, 2.4) + 'Add chore</button><button type="button" class="btn" data-act="admin" data-sub="copy">Copy from other house</button></div>' + body);
}
function adminOther() {
  const house = adminHouse();
  const other = S.view.otherHouse;
  const list = otherHouseChores(house).filter((c) => c.house === other);
  const body = choreRowsByTime(list, (c) => '<div class="list-row"' + (c.active === false ? ' style="opacity:.6"' : '') + '>' + choreSummary(c) + '</div>') ||
    '<div class="empty">' + h(houseName(other)) + ' has no chores yet.</div>';
  return adminScreen(adminTop(houseName(other), { eyebrow: 'Chores · view only', colour: '#4F46E5', shadow: '#3730A3', back: 'chores' }) +
    '<p class="small muted" style="margin:0">Only the adults at ' + h(houseName(other)) + ' can change these. To use one here, tap Copy from other house.</p>' + body);
}
function adminCopy() {
  const house = choreHouse();
  const others = otherHouseChores(house).sort((a, b) => a.name.localeCompare(b.name));
  const rows = others.map((c) => '<div class="list-row"><div class="grow col"><div style="font-weight:800">' + h(c.name) + '</div><div class="small muted">' + h(houseName(c.house)) + ' · ' + L.fmtTime(c.due) + ' · ' + c.pts + ' pts · ' + h(c.kids.map(kidName).join(', ')) + '</div></div><button type="button" class="btn" style="min-height:44px" data-act="copy-chore" data-id="' + h(c.id) + '">Copy</button></div>').join('') || '<div class="empty">The other house has no chores yet.</div>';
  return adminScreen(adminTop('Copy a chore', { eyebrow: 'Into ' + houseName(house), colour: '#1D4ED8', shadow: '#1E3A8A', back: 'chores' }) + '<p class="small muted" style="margin:0">Copies go into ' + h(houseName(house)) + ' for kids who stay here. You can edit them after.</p><div class="col" style="gap:8px">' + rows + '</div>');
}
function copyChore(id) {
  const src = S.chores.find((c) => c.id === id);
  if (!src) return;
  const house = choreHouse();
  const allowed = L.kidsForHouse(house, S.config);
  const kids = src.kids.filter((k) => allowed.includes(k));
  if (!kids.length) { toast('None of those kids stay at this house.', true); return; }
  const { id: _old, ...rest } = src;
  touchAdmin();
  const newId = slug(src.name) + '-' + rid().slice(0, 4);
  const ops = [{ op: 'set', path: 'chores/' + newId, data: Object.assign({}, rest, { house, kids, rotate: kids.length > 1 ? (rest.rotate || false) : false }) }];
  if (kids.length > 1 && rest.rotate === 'turns') ops.push({ op: 'set', path: 'turns/' + newId, data: { kid: kids[0], lastCid: '', prev: '' } });
  write(ops, 'Copied: ' + src.name);
}
function adminChoreEdit() {
  const id = S.view.editId;
  const c = id ? S.chores.find((x) => x.id === id) : null;
  const house = c ? c.house : choreHouse();
  if (id && !c) { S.view.sub = 'chores'; return adminChores(); }
  const v = c || { name: '', group: 'evening', due: '19:00', pts: 5, kids: [], days: [0, 1, 2, 3, 4, 5, 6], rotate: false, rotateOffset: 0, schoolOnly: false, schoolNext: false, active: true };
  const todayWho = L.shareMode(v) === 'daily' ? L.dailyWho(v, L.dateKey(new Date())) : v.kids[0];
  const kids = L.kidsForHouse(house, S.config);
  const g = L.GROUPS.find((x) => x.id === v.group) || L.GROUPS[0];
  const mode = v.rotate === 'turns' ? 'turns' : v.rotate ? 'daily' : 'each';
  const turnNow = id && S.turns[id] ? S.turns[id].kid : '';
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const order = [1, 2, 3, 4, 5, 6, 0];
  return adminScreen(adminTop(c ? 'Edit chore' : 'New chore', { eyebrow: houseName(house), colour: g.colour, shadow: '#0B1222', back: 'chores' }) +
    '<form data-form="chore" class="col" style="gap:16px"><input type="hidden" name="id" value="' + h(id || '') + '">' +
    '<div class="card">' +
    '<div class="field"><label for="c-name">Chore name</label><input class="input" id="c-name" name="name" required maxlength="60" value="' + h(v.name) + '"></div>' +
    '<div class="grid2"><div class="field"><label for="c-group">Group</label><select class="input" id="c-group" name="group">' + L.GROUPS.map((x) => '<option value="' + x.id + '"' + (x.id === v.group ? ' selected' : '') + '>' + x.name + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="c-due">Due by</label><input class="input" id="c-due" name="due" type="time" required value="' + h(v.due) + '"></div></div>' +
    '<div class="field"><label for="c-pts">Points</label><input class="input" id="c-pts" name="pts" type="number" min="0" max="1000" step="1" required value="' + v.pts + '"><div class="small muted">' + perDollar() + ' points = $1</div></div>' +
    '<div class="field"><label for="c-note">Note (optional)</label><textarea class="input" id="c-note" name="note" maxlength="200" rows="2" placeholder="e.g. Take with breakfast">' + h(v.note || '') + '</textarea></div></div>' +
    '<div class="card"><div class="lbl">Who does it</div><div class="chips">' + kids.map((k) => '<label class="check" style="min-height:44px;padding:0 14px;border-radius:999px;border:2px solid ' + colourOf(k) + '"><input type="checkbox" name="kids" value="' + k + '"' + (v.kids.includes(k) ? ' checked' : '') + ' style="accent-color:' + colourOf(k) + '"><span style="font-weight:800">' + h(kidName(k)) + '</span></label>').join('') + '</div>' +
    '<div class="field"><label for="c-share">If more than one kid is ticked</label><select class="input" id="c-share" name="rotate">' +
    '<option value=""' + (mode === 'each' ? ' selected' : '') + '>Each kid does their own</option>' +
    '<option value="turns"' + (mode === 'turns' ? ' selected' : '') + '>Take turns — stays with them until done</option>' +
    '<option value="daily"' + (mode === 'daily' ? ' selected' : '') + '>Swap each day</option></select>' +
    '<div class="small muted">"Take turns" is for bins: whoever has it keeps it until they take it out, then it passes on. Done when needed, so it never holds up the Magic button.</div></div>' +
    '<div class="field only-turns"><label for="c-turn">Whose turn is it now?</label><select class="input" id="c-turn" name="turn"><option value="">— no change —</option>' + kids.map((k) => '<option value="' + k + '"' + (turnNow === k ? ' selected' : '') + '>' + h(kidName(k)) + '</option>').join('') + '</select></div>' +
    '<div class="field only-daily"><label for="c-off">Swap each day: who does it today (' + h(L.fmtKey(L.dateKey(new Date()))) + ')?</label><select class="input" id="c-off" name="todayKid">' + kids.map((k) => '<option value="' + k + '"' + (todayWho === k ? ' selected' : '') + '>' + h(kidName(k)) + '</option>').join('') + '</select><div class="small muted">Then it swaps every day after that.</div></div>' +
    '<div class="lbl">Repeat on</div><div class="days">' + order.map((d) => '<label><input type="checkbox" name="days" value="' + d + '"' + (v.days.includes(d) ? ' checked' : '') + ' aria-label="' + dayFull[d] + '"><span aria-hidden="true">' + dayNames[d] + '</span></label>').join('') + '</div>' +
    '<label class="check"><input type="checkbox" name="schoolOnly"' + (v.schoolOnly ? ' checked' : '') + '><span class="col" style="gap:2px"><span style="font-weight:800">School days only</span><span class="small muted">Hidden on weekends, public holidays and school holidays</span></span></label>' +
    '<label class="check"><input type="checkbox" name="schoolNext"' + (v.schoolNext ? ' checked' : '') + '><span class="col" style="gap:2px"><span style="font-weight:800">Only the night before a school day</span><span class="small muted">For things like packing the school bag</span></span></label>' +
    '<label class="check"><input type="checkbox" name="optional"' + (v.optional ? ' checked' : '') + '><span class="col" style="gap:2px"><span style="font-weight:800">Optional</span><span class="small muted">Still earns points, but isn\'t needed for the Magic button or counted in the weekly check</span></span></label>' +
    '<label class="check"><input type="checkbox" name="active"' + (v.active !== false ? ' checked' : '') + '><span class="col" style="gap:2px"><span style="font-weight:800">Active</span><span class="small muted">Untick to pause without deleting</span></span></label></div>' +
    '<button type="submit" class="btn primary big">Save chore</button>' +
    (c ? '<button type="button" class="btn ghost-red" data-act="del-chore" data-id="' + h(id) + '">Delete chore</button>' : '') +
    '</form>');
}
function submitChore(fd) {
  const existing = fd.get('id') ? S.chores.find((x) => x.id === fd.get('id')) : null;
  const house = existing ? existing.house : choreHouse();
  if (existing && existing.house !== adminHouse() && !isOwner()) { toast('Only the adults at ' + houseName(existing.house) + ' can change this chore', true); return; }
  const id = fd.get('id') || (slug(fd.get('name')) + '-' + rid().slice(0, 4));
  const kids = fd.getAll('kids');
  const days = fd.getAll('days').map(Number).sort();
  const name = fd.get('name').toString().trim();
  if (!name) { toast('Give the chore a name', true); return; }
  if (!kids.length) { toast('Tick at least one kid', true); return; }
  if (!days.length) { toast('Pick at least one day', true); return; }
  const pts = Math.max(0, Math.round(Number(fd.get('pts')) || 0));
  const share = kids.length > 1 ? (fd.get('rotate') || '') : '';
  if (share === 'daily' && !kids.includes(fd.get('todayKid'))) { toast('Pick who does it today from the kids ticked', true); return; }
  const data = { name, group: fd.get('group'), due: fd.get('due'), pts, kids, house, days, rotate: share || false, rotateOffset: share === 'daily' ? L.offsetFor(kids, fd.get('todayKid'), L.dateKey(new Date())) : 0, schoolOnly: !!fd.get('schoolOnly'), schoolNext: !!fd.get('schoolNext'), optional: !!fd.get('optional'), active: !!fd.get('active'), note: (fd.get('note') || '').toString().trim() };
  const ops = [{ op: 'set', path: 'chores/' + id, data }];
  if (share === 'turns') {
    const cur = S.turns[id] && S.turns[id].kid;
    const pick = fd.get('turn');
    const want = pick && kids.includes(pick) ? pick : (cur && kids.includes(cur) ? cur : kids[0]);
    if (want !== cur) ops.push({ op: 'set', path: 'turns/' + id, data: { kid: want, lastCid: '', prev: '' } });
  }
  touchAdmin();
  write(ops, 'Chore saved');
  S.view = { screen: 'admin', sub: 'chores', choreHouse: S.view.choreHouse };
  render();
}

function adminRewards() {
  const rows = S.rewards.slice().sort((a, b) => a.pts - b.pts).map((r, i) => '<button type="button" class="list-row btnlike" data-act="edit-reward" data-id="' + h(r.id) + '"' + (r.active === false ? ' style="opacity:.6"' : '') + '><span class="group-ico" style="background:' + REWARD_COLOURS[i % REWARD_COLOURS.length][0] + ';width:44px;height:44px;border-radius:14px">' + ico(r.icon || 'gift', 24, 2) + '</span><div class="grow col"><div style="font-weight:800">' + h(r.name) + '</div><div class="small muted">' + r.pts + ' pts' + (r.active === false ? ' · hidden' : '') + '</div></div></button>').join('') || '<div class="empty">No rewards yet.</div>';
  return adminScreen(adminTop('Rewards', { eyebrow: 'Shared by both houses', colour: '#DB2777', shadow: '#9D174D' }) + '<button type="button" class="btn primary" data-act="edit-reward" data-id="">' + ico('plus', 18, 2.4) + 'Add reward</button><div class="col" style="gap:8px">' + rows + '</div>');
}
function adminRewardEdit() {
  const id = S.view.editId;
  const r = id ? S.rewards.find((x) => x.id === id) : null;
  const v = r || { name: '', pts: 100, icon: 'gift', active: true };
  return adminScreen(adminTop(r ? 'Edit reward' : 'New reward', { colour: '#DB2777', shadow: '#9D174D', back: 'rewards' }) +
    '<form data-form="reward" class="col" style="gap:16px"><input type="hidden" name="id" value="' + h(id || '') + '"><div class="card">' +
    '<div class="field"><label for="r-name">Reward</label><input class="input" id="r-name" name="name" required maxlength="40" value="' + h(v.name) + '"></div>' +
    '<div class="field"><label for="r-pts">Points</label><input class="input" id="r-pts" name="pts" type="number" min="1" max="100000" required value="' + v.pts + '"></div>' +
    '<div class="field"><label for="r-icon">Picture</label><select class="input" id="r-icon" name="icon">' + REWARD_ICONS.map(([k, n]) => '<option value="' + k + '"' + (k === v.icon ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div>' +
    '<label class="check"><input type="checkbox" name="active"' + (v.active !== false ? ' checked' : '') + '><span style="font-weight:800">Show on the shelf</span></label></div>' +
    '<button type="submit" class="btn primary big">Save reward</button>' + (r ? '<button type="button" class="btn ghost-red" data-act="del-reward" data-id="' + h(id) + '">Delete reward</button>' : '') + '</form>');
}
function submitReward(fd) {
  const name = fd.get('name').toString().trim();
  const pts = Math.round(Number(fd.get('pts')));
  if (!name || !(pts > 0)) { toast('Name and points are needed', true); return; }
  const id = fd.get('id') || slug(name) + '-' + rid().slice(0, 4);
  touchAdmin();
  write([{ op: 'set', path: 'rewards/' + id, data: { name, pts, icon: fd.get('icon'), active: !!fd.get('active') } }], 'Reward saved');
  S.view = { screen: 'admin', sub: 'rewards' };
  render();
}

function adminSchedule() {
  const cfg = S.config;
  const shared = sharedKids();
  const houses = Object.keys(cfg.houses);
  const c = cfg.custody;
  const nowMs = L.localMs(new Date());
  let weeks = '';
  if (shared.length) {
    let t = nowMs;
    for (let i = 0; i < 6; i++) {
      const hs = L.houseAt(shared[0], t, cfg);
      const nc = nextChange(shared[0], t);
      weeks += '<div class="row" style="min-height:44px"><div class="grow col" style="gap:0"><span style="font-weight:800;font-size:15px">' + (i === 0 ? 'Now' : h(L.fmtLocalMs(t))) + ' → ' + (nc ? h(L.fmtLocalMs(nc.at)) : '…') + '</span></div><span class="count-pill" style="background:' + (hs === houses[0] ? '#DBEAFE;color:#1E40AF' : '#FCE7F3;color:#9D174D') + '">' + h(houseName(hs)) + '</span></div>';
      if (!nc) break;
      t = nc.at;
    }
  }
  const ov = (cfg.overrides || []).map((o, i) => '<div class="list-row"><div class="grow col"><div style="font-weight:800">' + h(houseName(o.house)) + '</div><div class="small muted">' + h(L.fmtLocalMs(L.parseLocal(o.from))) + ' → ' + h(L.fmtLocalMs(L.parseLocal(o.to))) + '</div></div><button type="button" class="icon-btn light" data-act="del-override" data-i="' + i + '" aria-label="Remove">' + ico('trash', 18, 2) + '</button></div>').join('') || '<div class="small muted">No changes to the usual pattern.</div>';
  const terms = (cfg.terms || []).slice().sort((a, b) => a.start.localeCompare(b.start)).map((tr) => '<div class="list-row"><div class="grow" style="font-weight:800">' + L.fmtKey(tr.start) + ' – ' + L.fmtKey(tr.end) + ' ' + tr.start.slice(0, 4) + '</div><button type="button" class="icon-btn light" data-act="del-term" data-start="' + tr.start + '" aria-label="Remove term">' + ico('trash', 18, 2) + '</button></div>').join('');
  const dateList = (field, label) => {
    const items = (cfg[field] || []).slice().sort();
    const future = items.filter((d) => d >= L.dateKey(new Date()));
    return '<div class="lbl">' + label + '</div>' + (future.length ? '<div class="chips">' + future.map((d) => '<span class="chip blue" style="display:inline-flex;align-items:center;gap:6px;padding-right:6px">' + L.fmtKey(d) + ' ' + d.slice(0, 4) + '<button type="button" class="icon-btn light" style="width:32px;height:32px;border-radius:10px;border:none" data-act="del-date" data-field="' + field + '" data-d="' + d + '" aria-label="Remove ' + d + '">' + ico('trash', 14, 2) + '</button></span>').join('') + '</div>' : '<div class="small muted">None coming up.</div>') +
      '<form data-form="add-date" class="row"><input type="hidden" name="field" value="' + field + '"><input class="input grow" type="date" name="d" required aria-label="Add a date"><button class="btn" type="submit">Add</button></form>';
  };
  return adminScreen(adminTop('House schedule', { colour: '#4F46E5', shadow: '#3730A3' }) +
    (shared.length ? '<div class="card"><h2 style="font-size:18px">' + h(shared.map(kidName).join(' & ')) + '</h2>' + weeks + '</div>' +
      '<form data-form="custody" class="card"><h2 style="font-size:18px">Usual pattern</h2><p class="small muted" style="margin:0">Week on, week off. Enter any one changeover you know, and where the kids went.</p>' +
      '<div class="field"><label for="s-anchor">A changeover date and time</label><input class="input" id="s-anchor" name="anchor" type="datetime-local" required value="' + h(c.anchor) + '"></div>' +
      '<div class="field"><label for="s-first">At that time they went to</label><select class="input" id="s-first" name="first">' + houses.map((x) => '<option value="' + x + '"' + (x === c.firstHouse ? ' selected' : '') + '>' + h(houseName(x)) + '</option>').join('') + '</select></div>' +
      '<button class="btn primary" type="submit">Save pattern</button></form>' +
      '<div class="card"><h2 style="font-size:18px">Swaps &amp; holidays</h2>' + ov +
      '<form data-form="override" class="col" style="gap:10px"><div class="field"><label for="o-from">From</label><input class="input" id="o-from" name="from" type="datetime-local" required></div><div class="field"><label for="o-to">Until</label><input class="input" id="o-to" name="to" type="datetime-local" required></div><div class="field"><label for="o-house">Kids are at</label><select class="input" id="o-house" name="house">' + houses.map((x) => '<option value="' + x + '">' + h(houseName(x)) + '</option>').join('') + '</select></div><button class="btn" type="submit">' + ico('plus', 18, 2.4) + 'Add swap or holiday</button></form></div>' : '') +
    '<div class="card"><h2 style="font-size:18px">School terms</h2><p class="small muted" style="margin:0">After School chores only show on school days. NSW public school dates for 2026–2027 are loaded.</p><div class="col" style="gap:6px">' + terms + '</div>' +
    '<form data-form="term" class="col" style="gap:10px"><div class="grid2"><div class="field"><label for="t-s">Term starts</label><input class="input" id="t-s" name="start" type="date" required></div><div class="field"><label for="t-e">Term ends</label><input class="input" id="t-e" name="end" type="date" required></div></div><button class="btn" type="submit">' + ico('plus', 18, 2.4) + 'Add term</button></form></div>' +
    '<div class="card">' + dateList('publicHolidays', 'Public holidays') + dateList('pupilFreeDays', 'Pupil-free days') + '</div>');
}

function adminBalances() {
  const house = adminHouse();
  const kids = L.kidsForHouse(house, S.config);
  const cards = kids.map((k) => '<div class="card" style="box-shadow:0 4px 0 ' + colourOf(k) + '"><div class="row">' + solidAvatar(k, 'sm') + '<div class="grow col"><div style="font-weight:800;font-size:17px">' + h(kidName(k)) + '</div><div class="small muted">' + starsThisYear(k).length + ' Above &amp; Beyond ' + sinceText() + (heldFor(k) ? ' · ' + heldFor(k) + ' on hold' : '') + '</div></div><div class="col" style="align-items:flex-end;gap:0"><div style="font-family:var(--display);font-weight:600;font-size:24px">' + points(k) + '</div><div class="small" style="color:#9A3412">' + L.money(points(k), perDollar()) + '</div></div></div></div>').join('');
  const adj = S.adjustments.filter((a) => kids.includes(a.kid)).slice(0, 10).map((a) => '<div class="list-row"><div class="grow col"><div style="font-weight:800">' + h(kidName(a.kid)) + ' · ' + h(a.reason || 'Adjustment') + '</div><div class="small muted">' + (a.at ? L.fmtKey(L.dateKey(a.at)) : '') + ' · ' + h(adultName(a.by)) + '</div></div><div style="font-weight:800;color:' + (a.pts < 0 ? '#B91C1C' : '#15803D') + '">' + (a.pts > 0 ? '+' : '') + a.pts + '</div></div>').join('');
  return adminScreen(adminTop('Balances', { colour: '#15803D', shadow: '#166534' }) + cards +
    '<form data-form="adjust" class="card"><h2 style="font-size:18px">Add or take away points</h2>' +
    '<div class="field"><label for="a-kid">Kid</label><select class="input" id="a-kid" name="kid">' + kids.map((k) => '<option value="' + k + '">' + h(kidName(k)) + '</option>').join('') + '</select></div>' +
    '<div class="lbl">Add or take away?</div><div class="grid2 seg">' +
    '<label class="seg-opt add"><input type="radio" name="dir" value="add" checked><span>' + ico('plus', 18, 2.6) + 'Add</span></label>' +
    '<label class="seg-opt take"><input type="radio" name="dir" value="take"><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>Take away</span></label></div>' +
    '<div class="field"><label for="a-pts">How many points</label><input class="input" id="a-pts" name="pts" type="number" inputmode="numeric" min="1" step="1" required placeholder="e.g. 50"></div>' +
    '<div class="field"><label for="a-why">Reason</label><input class="input" id="a-why" name="reason" maxlength="80" required placeholder="e.g. Correction, birthday bonus"></div>' +
    '<button class="btn primary" type="submit">Save</button></form>' +
    (adj ? '<h2 style="font-size:18px">Recent changes</h2><div class="col" style="gap:8px">' + adj + '</div>' : ''));
}

function adminPeople() {
  const cfg = S.config;
  const me = S.admin.as;
  const houses = Object.keys(cfg.houses);
  return adminScreen(adminTop('People & PINs', { colour: '#0F766E', shadow: '#115E59' }) +
    '<form data-form="mypin" class="card"><h2 style="font-size:18px">Change my PIN (' + h(adultName(me)) + ')</h2>' +
    '<div class="grid2"><div class="field"><label for="p1">New PIN</label><input class="input" id="p1" name="p1" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></div><div class="field"><label for="p2">Again</label><input class="input" id="p2" name="p2" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></div></div><button class="btn primary" type="submit">Save PIN</button></form>' +
    '<form data-form="houses" class="card"><h2 style="font-size:18px">Houses</h2>' + houses.map((x) => '<div class="field"><label for="hn-' + x + '">House name</label><input class="input" id="hn-' + x + '" name="name_' + x + '" maxlength="30" required value="' + h(cfg.houses[x].name) + '"></div><div class="lbl">Adults who run ' + h(cfg.houses[x].name) + '</div><div class="chips">' + ADULTS.map((a) => '<label class="check" style="padding:0 14px;border:2px solid #C9CFDC;border-radius:999px"><input type="checkbox" name="admins_' + x + '" value="' + a + '"' + ((cfg.houses[x].admins || []).includes(a) ? ' checked' : '') + '><span style="font-weight:800">' + h(adultName(a)) + '</span></label>').join('') + '</div>').join('<hr style="border:none;border-top:2px solid #EEF1F8;width:100%">') +
    '<button class="btn primary" type="submit">Save houses</button></form>' +
    '<form data-form="kids" class="card"><h2 style="font-size:18px">Kids</h2>' + Object.keys(cfg.kids).map((k) => '<div class="field"><label for="kn-' + k + '">Name shown for ' + h(k) + '</label><input class="input" id="kn-' + k + '" name="kid_' + k + '" maxlength="20" required value="' + h(cfg.kids[k].name) + '"></div>').join('') +
    '<p class="small muted" style="margin:0">Kids choose their own colour on their Me page.</p><button class="btn primary" type="submit">Save names</button></form>');
}

function magicSettingsCard() {
  const m = L.magicCfg(S.config);
  const kids = L.kidsForHouse(adminHouse(), S.config);
  return '<form data-form="magic-settings" class="card" style="border:2px solid #C7D2FE"><h2 style="font-size:18px">Magic button</h2>' +
    '<p class="small muted" style="margin:0">When every chore is ticked, kids tap it in the evening for bonus points. ' + m.streakDays + ' nights in a row earns an Above and Beyond star. Shared by both houses.</p>' +
    '<div class="grid2"><div class="field"><label for="mg-from">Opens</label><input class="input" id="mg-from" name="from" type="time" required value="' + h(m.from) + '"></div><div class="field"><label for="mg-to">Closes</label><input class="input" id="mg-to" name="to" type="time" required value="' + h(m.to) + '"></div></div>' +
    '<div class="grid2"><div class="field"><label for="mg-pts">Points each night</label><input class="input" id="mg-pts" name="pts" type="number" min="0" max="1000" required value="' + m.pts + '"></div><div class="field"><label for="mg-days">Nights in a row for a star</label><input class="input" id="mg-days" name="streakDays" type="number" min="1" max="365" required value="' + m.streakDays + '"></div></div>' +
    '<div class="lbl">Who has it</div><div class="chips">' + kids.map((k) => '<label class="check" style="padding:0 14px;border:2px solid ' + colourOf(k) + ';border-radius:999px"><input type="checkbox" name="kids" value="' + k + '"' + (m.kids.includes(k) ? ' checked' : '') + '><span style="font-weight:800">' + h(kidName(k)) + '</span></label>').join('') + '</div>' +
    '<button class="btn primary" type="submit">Save</button></form>';
}
function tallyCard() {
  const house = adminHouse();
  const kids = L.kidsForHouse(house, S.config);
  const now = kids.map((k) => '<div class="list-row" style="background:#FFFBEB">' + solidAvatar(k, 'sm') + '<div class="grow" style="font-weight:800">' + h(kidName(k)) + '</div><div class="row" style="gap:6px;font-family:var(--display);font-weight:600;font-size:22px">' + starIco(20, '#CA8A04') + starsThisYear(k).length + '</div></div>').join('');
  const hist = (S.config.starHistory || []).slice().reverse().map((t) => '<div class="list-row"><div class="grow col"><div style="font-weight:800">' + h(t.label) + '</div><div class="small muted">' + shortDate(t.start) + ' ' + t.start.slice(0, 4) + ' – ' + shortDate(t.end) + ' ' + t.end.slice(0, 4) + '</div><div class="small">' + kids.map((k) => h(kidName(k)) + ' ' + ((t.totals || {})[k] || 0)).join(' · ') + '</div></div></div>').join('');
  const suggested = 'Christmas ' + L.dateKey(new Date()).slice(0, 4);
  return '<form data-form="close-tally" class="card" style="border:2px solid #FACC15"><h2 style="font-size:18px">Above and Beyond tally</h2>' +
    '<p class="small muted" style="margin:0">Counting ' + sinceText() + '. Shared by both houses.</p><div class="col" style="gap:8px">' + now + '</div>' +
    '<div class="field"><label for="t-label">Name for this tally</label><input class="input" id="t-label" name="label" maxlength="40" required value="' + h(suggested) + '"></div>' +
    '<button type="submit" class="btn" style="border-color:#CA8A04;color:#713F12">' + starIco(18, '#CA8A04') + 'Close this tally &amp; start again</button>' +
    '<p class="small muted" style="margin:0">Saves everyone\'s total, then all counts go back to 0. Points are not affected.</p>' +
    (hist ? '<div class="lbl">Past tallies</div><div class="col" style="gap:8px">' + hist + '</div>' : '') + '</form>';
}
function adminSettings() {
  const cfg = S.config;
  const presets = (cfg.abPresets || []).map((p, i) => '<span class="chip blue" style="display:inline-flex;align-items:center;gap:6px;padding-right:6px">' + h(p) + '<button type="button" class="icon-btn light" style="width:32px;height:32px;border-radius:10px;border:none" data-act="del-preset" data-i="' + i + '" aria-label="Remove ' + h(p) + '">' + ico('trash', 14, 2) + '</button></span>').join('');
  return adminScreen(adminTop('Settings', { colour: '#475569', shadow: '#334155' }) +
    '<form data-form="money" class="card"><h2 style="font-size:18px">Points and money</h2>' +
    '<div class="field"><label for="m-pd">Points per $1</label><input class="input" id="m-pd" name="perDollar" type="number" min="1" required value="' + (cfg.pointsPerDollar || 100) + '"><div class="small muted">Now: 1,000 points = ' + L.money(1000, cfg.pointsPerDollar || 100) + '</div></div>' +
    '<div class="field"><label for="m-lot">Cash out in lots of (points)</label><input class="input" id="m-lot" name="lot" type="number" min="1" required value="' + (cfg.cashOutLot || 1000) + '"></div>' +
    '<button class="btn primary" type="submit">Save</button></form>' +
    magicSettingsCard() + penaltySettingsCard() + tallyCard() +
    '<div class="card"><h2 style="font-size:18px">Above and Beyond choices</h2><div class="chips">' + presets + '</div>' +
    '<form data-form="add-preset" class="row"><input class="input grow" name="p" maxlength="60" required aria-label="New choice" placeholder="Add a choice"><button class="btn" type="submit">Add</button></form></div>' +
    backupCard() +
    '<div class="card"><h2 style="font-size:18px">This phone</h2><p class="small muted" style="margin:0">Signed in as ' + h(adultName(S.user) || S.user) + ' · Tidy Tribe v' + VERSION + (S.store.mode === 'demo' ? ' · demo mode' : '') + '</p>' +
    '<button type="button" class="btn danger" data-act="signout">Sign out of this phone</button>' +
    (S.store.mode === 'demo' ? '<button type="button" class="btn ghost-red" data-act="demo-reset">Clear demo data</button>' : '') + '</div>');
}

// ---------- routing ----------
function viewKid() {
  const k = S.view.kid;
  if (!k || !S.config.kids[k]) { S.view = { screen: 'picker' }; return viewPicker(); }
  if (S.view.tab === 'rewards') return viewKidRewards(k);
  if (S.view.tab === 'me') return viewKidMe(k);
  if (S.view.tab === 'day') return viewKidDay(k, S.view.date);
  return viewKidToday(k);
}
function render() {
  const ae = document.activeElement;
  if (ae && app.contains(ae) && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName) && ae.type !== 'checkbox' && ae.type !== 'radio') {
    S.pendingRender = true;
    return;
  }
  S.pendingRender = false;
  let html;
  if (!S.store || S.user === undefined) html = '<div class="loading"><span class="logo-mark big"></span><p>Loading Tidy Tribe…</p></div>';
  else if (!S.user) html = viewLogin();
  else if (S.error) html = '<div class="screen"><div class="top pad"><span class="logo-mark big"></span><h1 class="title-xl">Something is not right</h1><div class="banner err">' + h(S.error) + '</div><button class="btn" data-act="retry">Try again</button><button class="btn danger" data-act="signout">Sign out</button></div></div>';
  else if (!ADULTS.includes(S.user) && !KIDS_WITH_PHONES.includes(S.user)) html = '<div class="screen"><div class="top pad"><h1 class="title-xl">Unknown account</h1><p>This sign-in is not part of Tidy Tribe.</p><button class="btn" data-act="signout">Sign out</button></div></div>';
  else if (S.config === undefined) html = '<div class="loading"><span class="logo-mark big"></span><p>Loading your family…</p></div>';
  else if (S.config === null) html = viewSetup();
  else {
    if (isKidUser() && S.view.screen !== 'kid') S.view = { screen: 'kid', kid: S.user, tab: S.view.tab || 'today' };
    const scr = S.view.screen;
    html = scr === 'kid' ? viewKid() : scr === 'pin' && S.pin ? viewPin() : scr === 'admin' ? viewAdmin() : viewPicker();
  }
  app.innerHTML = html;
}

// ---------- events ----------
const ACT = {
  'login-who': (d) => { S.login.who = d.who || null; render(); const pw = document.getElementById('pw'); if (pw) pw.focus(); },
  go: (d) => { if (d.screen === 'pin') { openPin(); return; } S.view = { screen: d.screen, tab: 'today' }; render(); window.scrollTo(0, 0); },
  'open-kid': (d) => { S.view = { screen: 'kid', kid: d.kid, tab: 'today' }; render(); window.scrollTo(0, 0); },
  tab: (d) => { S.view.tab = d.tab; render(); window.scrollTo(0, 0); },
  day: (d) => { S.view.tab = 'day'; S.view.date = d.date; render(); window.scrollTo(0, 0); },
  'more-days': () => { S.moreDays = true; render(); },
  tick: (d) => tick(d.kid, d.chore),
  request: (d) => requestReward(d.kid, d.reward),
  cashout: (d) => { if (confirm('Ask for ' + L.money(S.config.cashOutLot || 1000, perDollar()) + ' cash?')) requestCashout(d.kid); },
  'cancel-req': (d) => cancelRequest(d.id),
  colour: (d) => setColour(d.kid, d.colour),
  setup: () => runSetup(),
  signout: async () => { if (!confirm('Sign out of Tidy Tribe on this phone?')) return; S.admin = null; unsubscribeAll(); S.view = { screen: 'picker', tab: 'today' }; S.login = { who: null }; await S.store.signOut(); },
  retry: () => { S.error = null; S.subsKey = ''; subscribe(); render(); },
  pin: (d) => pinKey(d.k),
  'pin-adult': (d) => { const pins = S.config.pins || {}; S.pin = { adult: d.adult, entry: '', stage: pins[d.adult] ? 'enter' : 'create1', first: '', msg: '' }; render(); },
  'pin-cancel': () => { S.pin = null; S.view = isKidUser() ? { screen: 'kid', kid: S.user, tab: 'today' } : { screen: 'picker' }; render(); },
  lock: () => { S.admin = null; S.view = { screen: 'picker' }; render(); window.scrollTo(0, 0); },
  admin: (d) => { touchAdmin(); S.view = { screen: 'admin', sub: d.sub, choreHouse: (d.sub === 'chores' || d.sub === 'copy') ? S.view.choreHouse : undefined }; render(); window.scrollTo(0, 0); if (d.sub === 'restore') loadSnaps(); },
  decide: (d) => decideRequest(d.id, d.ok === '1'),
  'ab-kid': (d) => { const f = S.form.ab; f.kids = f.kids.includes(d.kid) ? f.kids.filter((x) => x !== d.kid) : f.kids.concat([d.kid]); keepAbInputs(); render(); },
  'ab-what': (d) => { const f = S.form.ab; f.what = f.what === d.what ? '' : d.what; keepAbInputs(); render(); },
  'ab-del': (d) => {
    const s = S.stars.find((x) => x.id === d.id);
    if (!s || !confirm('Remove this star from ' + kidName(s.kid) + '?')) return;
    touchAdmin();
    write([{ op: 'delete', path: 'stars/' + s.id }, { op: 'update', path: 'balances/' + s.kid, data: { ['stars.' + starPeriodOf(s)]: inc(-1) } }], 'Star removed');
  },
  'edit-chore': (d) => { touchAdmin(); S.view = { screen: 'admin', sub: 'chore', editId: d.id || null, choreHouse: S.view.choreHouse }; render(); window.scrollTo(0, 0); },
  'chore-house': (d) => { touchAdmin(); S.view = { screen: 'admin', sub: 'chores', choreHouse: d.house }; render(); },
  magic: (d) => magicTap(d.kid),
  'del-chore': (d) => { if (!confirm('Delete this chore? Points already earned stay.')) return; touchAdmin(); write([{ op: 'delete', path: 'chores/' + d.id }].concat(S.turns[d.id] ? [{ op: 'delete', path: 'turns/' + d.id }] : []), 'Chore deleted'); S.view = { screen: 'admin', sub: 'chores', choreHouse: S.view.choreHouse }; render(); },
  'copy-chore': (d) => copyChore(d.id),
  'other-house': (d) => { touchAdmin(); S.view = { screen: 'admin', sub: 'other', otherHouse: d.house }; render(); window.scrollTo(0, 0); },
  'edit-reward': (d) => { touchAdmin(); S.view = { screen: 'admin', sub: 'reward', editId: d.id || null }; render(); window.scrollTo(0, 0); },
  'del-reward': (d) => { if (!confirm('Delete this reward?')) return; touchAdmin(); write([{ op: 'delete', path: 'rewards/' + d.id }], 'Reward deleted'); S.view = { screen: 'admin', sub: 'rewards' }; render(); },
  'del-override': (d) => { const o = (S.config.overrides || []).slice(); o.splice(Number(d.i), 1); touchAdmin(); write([{ op: 'update', path: 'config/main', data: { overrides: o } }], 'Removed'); },
  'del-term': (d) => { touchAdmin(); write([{ op: 'update', path: 'config/main', data: { terms: (S.config.terms || []).filter((t) => t.start !== d.start) } }], 'Term removed'); },
  'del-date': (d) => { touchAdmin(); write([{ op: 'update', path: 'config/main', data: { [d.field]: (S.config[d.field] || []).filter((x) => x !== d.d) } }], 'Removed'); },
  'del-preset': (d) => { const p = (S.config.abPresets || []).slice(); p.splice(Number(d.i), 1); touchAdmin(); write([{ op: 'update', path: 'config/main', data: { abPresets: p } }], 'Removed'); },
  backup: () => exportBackup(),
  'dbx-connect': async () => { const k = document.getElementById('dbx-key'); try { await B.connect(k ? k.value : ''); } catch (e) { toast(e.message || String(e), true); } },
  'dbx-now': async () => { touchAdmin(); if (await runBackup('manual')) toast('Backed up to Dropbox ✓'); else toast(B.meta().error || 'Backup failed', true); },
  'dbx-off': () => { if (!confirm('Disconnect Dropbox on this phone? Backups already in Dropbox are kept.')) return; B.disconnect(); render(); toast('Dropbox disconnected'); },
  'restore-snap': async (d) => {
    try { toast('Downloading…'); const f = await B.readBackup(d.path); await restoreData(f.data, d.when); } catch (e) { toast(e.message || String(e), true); }
  },
  'demo-reset': () => { if (confirm('Clear all demo data on this phone?')) { S.store.resetDemo(); S.admin = null; S.view = { screen: 'picker' }; render(); } }
};
function keepAbInputs() {
  const o = document.getElementById('ab-other');
  const n = document.getElementById('ab-note');
  if (o) S.form.ab.other = o.value;
  if (n) S.form.ab.note = n.value;
}
const FORMS = {
  login: async (fd, form) => {
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try { await S.store.signIn(S.login.who, fd.get('password')); } catch (e) {
      btn.disabled = false;
      const code = e && e.code ? e.code : '';
      toast(code.includes('invalid') || code.includes('wrong-password') || code.includes('user-not-found') ? 'Wrong password, or that person has not been added in Firebase yet.' : code.includes('network') ? 'No internet — sign-in needs a connection the first time.' : 'Sign-in failed: ' + (e.message || e), true);
    }
  },
  ab: (fd) => submitAB(fd),
  chore: (fd) => submitChore(fd),
  reward: (fd) => submitReward(fd),
  custody: (fd) => {
    const houses = Object.keys(S.config.houses);
    const first = fd.get('first');
    const second = houses.find((x) => x !== first) || first;
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { custody: { anchor: fd.get('anchor').slice(0, 16), firstHouse: first, secondHouse: second } } }], 'Pattern saved');
  },
  override: (fd) => {
    const from = fd.get('from').slice(0, 16); const to = fd.get('to').slice(0, 16);
    if (to <= from) { toast('"Until" must be after "From"', true); return; }
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { overrides: (S.config.overrides || []).concat([{ from, to, house: fd.get('house'), kids: sharedKids() }]) } }], 'Added');
  },
  term: (fd) => {
    const start = fd.get('start'); const end = fd.get('end');
    if (end < start) { toast('End must be after start', true); return; }
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { terms: (S.config.terms || []).concat([{ start, end }]).sort((a, b) => a.start.localeCompare(b.start)) } }], 'Term added');
  },
  'add-date': (fd) => {
    const field = fd.get('field'); const d = fd.get('d');
    const list = S.config[field] || [];
    if (list.includes(d)) return;
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { [field]: list.concat([d]).sort() } }], 'Added');
  },
  adjust: (fd, form) => {
    const kid = fd.get('kid'); let pts = Math.abs(Math.round(Number(fd.get('pts')))) * (fd.get('dir') === 'take' ? -1 : 1);
    if (pts < 0 && L.penaltyCfg(S.config).floor) {
      const can = Math.max(0, points(kid));
      if (can === 0) { toast(kidName(kid) + ' is already on 0 points', true); return; }
      if (-pts > can) { pts = -can; S.adjMsg = 'Only ' + can + ' taken — points can\'t go below 0'; }
    }
    if (!pts) { toast('Enter a number of points', true); return; }
    const id = rid('adj');
    touchAdmin();
    write([
      { op: 'set', path: 'adjustments/' + id, data: { kid, pts, reason: fd.get('reason').toString().trim(), by: S.admin.as, at: new Date() } },
      { op: 'update', path: 'balances/' + kid, data: { points: inc(pts), lastOp: 'adj_' + id } }
    ], S.adjMsg || 'Points updated'); S.adjMsg = null;
    form.reset();
  },
  mypin: async (fd, form) => {
    const p1 = fd.get('p1'); const p2 = fd.get('p2');
    if (!/^\d{4}$/.test(p1)) { toast('PIN must be 4 digits', true); return; }
    if (p1 !== p2) { toast('PINs do not match', true); return; }
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { ['pins.' + S.admin.as]: await pinHash(S.admin.as, p1) } }], 'PIN changed');
    form.reset();
  },
  houses: (fd) => {
    const data = {};
    for (const x of Object.keys(S.config.houses)) {
      data['houses.' + x + '.name'] = fd.get('name_' + x).toString().trim() || S.config.houses[x].name;
      data['houses.' + x + '.admins'] = fd.getAll('admins_' + x);
    }
    if (!Object.keys(S.config.houses).some((x) => (data['houses.' + x + '.admins'] || []).includes(S.admin.as))) {
      if (!confirm('You are not ticked for any house. You will lose access to admin screens. Continue?')) return;
    }
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data }], 'Houses saved');
  },
  kids: (fd) => {
    const data = {};
    for (const k of Object.keys(S.config.kids)) data['kids.' + k + '.name'] = fd.get('kid_' + k).toString().trim() || S.config.kids[k].name;
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data }], 'Names saved');
  },
  money: (fd) => {
    const pd = Math.round(Number(fd.get('perDollar'))); const lot = Math.round(Number(fd.get('lot')));
    if (!(pd > 0) || !(lot > 0)) { toast('Use numbers above 0', true); return; }
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { pointsPerDollar: pd, cashOutLot: lot } }], 'Saved');
  },
  meds: (fd) => {
    const kid = fd.get('kid');
    const text = (fd.get('text') || '').toString().trim();
    const m = S.meds[kid] || {};
    if ((m.current || '') === text) { toast('No change to save'); return; }
    const now = new Date();
    const history = (m.current || m.updatedAt) ? [{ text: m.current || '', at: m.updatedAt || now, until: now, by: m.by || '', house: m.house || '' }].concat(m.history || []).slice(0, 30) : (m.history || []);
    touchAdmin();
    write([{ op: 'set', path: 'meds/' + kid, data: { current: text, updatedAt: now, by: S.admin.as, house: adminHouse(), history } }], 'Saved for both houses');
  },
  'penalty-settings': (fd) => {
    const P = L.penaltyCfg(S.config);
    const pct = Math.min(100, Math.max(1, Math.round(Number(fd.get('pct')) || 50)));
    const pts = Math.max(1, Math.round(Number(fd.get('pts')) || 50));
    const visible = L.kidsForHouse(adminHouse(), S.config);
    const on = !!fd.get('on');
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { penalty: { on, pct, pts, floor: !!fd.get('floor'), kids: P.kids.filter((k) => !visible.includes(k)).concat(fd.getAll('kids')), since: (on && !P.on) || !P.since ? Date.now() : P.since } } }], 'Weekly check saved');
  },
  'magic-settings': (fd) => {
    const from = fd.get('from'); const to = fd.get('to');
    if (!(to > from)) { toast('"Closes" must be after "Opens"', true); return; }
    const pts = Math.max(0, Math.round(Number(fd.get('pts')) || 0));
    const streakDays = Math.max(1, Math.round(Number(fd.get('streakDays')) || 30));
    const visible = L.kidsForHouse(adminHouse(), S.config);
    const others = L.magicCfg(S.config).kids.filter((k) => !visible.includes(k)); // keep kids this adult can't see
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { magic: { from, to, pts, streakDays, kids: others.concat(fd.getAll('kids')) } } }], 'Magic button saved');
  },
  'close-tally': (fd) => {
    const label = fd.get('label').toString().trim();
    if (!label) { toast('Give this tally a name', true); return; }
    const per = curPeriod();
    const today = L.dateKey(new Date());
    const totals = {};
    for (const k of Object.keys(S.config.kids)) totals[k] = starsThisYear(k).length;
    if (!confirm('Close "' + label + '"? Totals are saved and everyone\'s Above & Beyond count starts again at 0. This affects both houses.')) return;
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: {
      starHistory: (S.config.starHistory || []).concat([{ id: per.id, label, start: per.start, end: today, totals, closedBy: S.admin.as }]),
      starPeriod: { id: 'p' + today.replace(/-/g, '') + '-' + rid().slice(0, 4), start: today }
    } }], 'Tally closed — counts start again');
  },
  'add-preset': (fd, form) => {
    const p = fd.get('p').toString().trim();
    if (!p || (S.config.abPresets || []).includes(p)) return;
    touchAdmin();
    write([{ op: 'update', path: 'config/main', data: { abPresets: (S.config.abPresets || []).concat([p]) } }], 'Added');
    form.reset();
  }
};
app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !app.contains(el) || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  try { fn(el.dataset, el, e); } catch (err) { console.error(err); toast('Oops: ' + err.message, true); }
});
app.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const fn = FORMS[form.dataset.form];
  if (!fn) return;
  try { fn(new FormData(form), form); } catch (err) { console.error(err); toast('Oops: ' + err.message, true); }
});
app.addEventListener('change', async (e) => {
  if (e.target.id === 'dbx-wifi') { B.setMeta({ wifiOnly: e.target.checked }); return; }
  if (e.target.id === 'restore-file' && e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    e.target.value = '';
    try { const f = B.parseFile(await file.text()); await restoreData(f.data, f.exportedAt ? whenText(f.exportedAt) : file.name); } catch (err) { toast(err.message || String(err), true); }
  }
});
app.addEventListener('focusout', () => { setTimeout(() => { if (S.pendingRender) render(); }, 0); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.user && S.config !== undefined) { subscribe(); render(); } });
setInterval(() => {
  if (!S.user || !S.store) return;
  if (S.admin && !adminOn() && S.view.screen === 'admin') { S.admin = null; S.view = { screen: 'picker' }; }
  subscribe(); // re-subscribes after midnight so the new day's chores appear
  render();
  autoBackup();
  applyPenalties();
}, 60000);

// ---------- start ----------
(async function boot() {
  let dbxMsg = null;
  try { dbxMsg = await B.handleReturn(); } catch (e) { dbxMsg = { ok: false, msg: String(e.message || e) }; }
  if (dbxMsg) setTimeout(() => toast(dbxMsg.msg, !dbxMsg.ok), 600);
  try {
    S.store = await createStore(FIREBASE_CONFIG);
  } catch (e) {
    console.error(e);
    app.innerHTML = '<div class="screen"><div class="top pad"><h1 class="title-xl">Could not start</h1><div class="banner err">' + h(e.message || e) + '</div><p>Check your internet connection, then reopen the app.</p></div></div>';
    return;
  }
  S.store.onAuth((uid) => {
    if (uid === S.user) { render(); return; }
    unsubscribeAll();
    S.user = uid;
    S.admin = null;
    if (!uid) S.login = { who: null };
    S.view = uid && KIDS_WITH_PHONES.includes(uid) ? { screen: 'kid', kid: uid, tab: 'today' } : { screen: 'picker', tab: 'today' };
    if (uid) subscribe();
    render();
  });
  render();
})();
window.__tt = S; // handy for troubleshooting
