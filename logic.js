// Tidy Tribe — pure logic (no browser or Firebase code). Tested with node.
export const TZ = 'Australia/Sydney';
export const DAY = 86400000;
export const WEEK = 7 * DAY;
export const GROUPS = [
  { id: 'morning', name: 'Morning', colour: '#B45309', light: '#FEF3C7' },
  { id: 'afterschool', name: 'After school', colour: '#0369A1', light: '#E0F2FE' },
  { id: 'evening', name: 'Evening', colour: '#4F46E5', light: '#E0E7FF' },
  { id: 'household', name: 'Household upkeep', colour: '#15803D', light: '#DCFCE7' }
];
// Kid colours. Bold ones carry white text; light ones (light: true) carry dark text,
// and use a deeper shade ("deep") wherever the colour is used as text on white.
export const KID_COLOUR_LIST = [
  { c: '#B91C1C', name: 'Red' },
  { c: '#C2410C', name: 'Orange' },
  { c: '#B45309', name: 'Amber' },
  { c: '#BE185D', name: 'Raspberry' },
  { c: '#DB2777', name: 'Hot pink' },
  { c: '#7C3AED', name: 'Purple' },
  { c: '#4338CA', name: 'Indigo' },
  { c: '#1D4ED8', name: 'Blue' },
  { c: '#0369A1', name: 'Ocean' },
  { c: '#0E7490', name: 'Deep aqua' },
  { c: '#0D9488', name: 'Teal' },
  { c: '#0F766E', name: 'Dark teal' },
  { c: '#15803D', name: 'Green' },
  { c: '#4D7C0F', name: 'Lime' },
  { c: '#334155', name: 'Slate' },
  { c: '#67E8F9', name: 'Light aqua', light: true, deep: '#0E7490' },
  { c: '#5EEAD4', name: 'Light teal', light: true, deep: '#0F766E' },
  { c: '#A7F3D0', name: 'Mint', light: true, deep: '#047857' },
  { c: '#93C5FD', name: 'Sky', light: true, deep: '#1D4ED8' },
  { c: '#C4B5FD', name: 'Lavender', light: true, deep: '#6D28D9' },
  { c: '#F9A8D4', name: 'Bubblegum', light: true, deep: '#BE185D' },
  { c: '#FDBA74', name: 'Peach', light: true, deep: '#C2410C' },
  { c: '#FDE68A', name: 'Butter', light: true, deep: '#A16207' }
];
export const KID_COLOURS = KID_COLOUR_LIST.map((x) => x.c);
function colourInfo(c) { return KID_COLOUR_LIST.find((x) => x.c.toLowerCase() === String(c || '').toLowerCase()) || { c, name: c }; }
export function colourName(c) { return colourInfo(c).name; }
// Text colour to put ON the kid colour.
export function inkOn(c) { return colourInfo(c).light ? '#172033' : '#FFFFFF'; }
// The kid colour to use AS text on a white background.
export function deepOf(c) { return colourInfo(c).deep || c; }
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const fmt = new Intl.DateTimeFormat('en-AU', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short'
});

// Sydney wall-clock parts for a real Date.
export function parts(date) {
  const o = {};
  for (const p of fmt.formatToParts(date)) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, dow: WD[o.weekday] };
}
// "Local ms": Sydney wall-clock time encoded as if it were UTC. Safe for comparisons across DST.
export function localMs(date) {
  const p = parts(date);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
}
export function pad(n) { return String(n).padStart(2, '0'); }
export function dateKey(date) {
  const p = parts(date);
  return p.y + '-' + pad(p.m) + '-' + pad(p.d);
}
export function keyToLocalMs(key, hhmm) {
  const [y, m, d] = key.split('-').map(Number);
  const [h, mi] = (hhmm || '00:00').split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, mi);
}
export function parseLocal(str) { // 'YYYY-MM-DDTHH:MM'
  const [k, t] = str.split('T');
  return keyToLocalMs(k, t || '00:00');
}
export function keyDow(key) { return new Date(keyToLocalMs(key)).getUTCDay(); }
export function addDays(key, n) {
  const t = new Date(keyToLocalMs(key) + n * DAY);
  return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
}
export function dayNumber(key) { return Math.round(keyToLocalMs(key) / DAY); }
// "Swap each day" chores: who has it on a date (when all its kids are at that house), and the offset that gives `pick` the chore on `key`.
export function dailyWho(ch, key) { const n = (ch.kids || []).length; if (!n) return null; return ch.kids[(((dayNumber(key) + (ch.rotateOffset || 0)) % n) + n) % n]; }
export function offsetFor(kids, pick, key) { const n = kids.length; const i = kids.indexOf(pick); if (!n || i < 0) return 0; return (((i - dayNumber(key)) % n) + n) % n; }
// Real Date of the next Sydney midnight after `now`.
export function nextMidnight(now) {
  const offset = localMs(now) - Math.floor(now.getTime() / 60000) * 60000;
  const key = addDays(dateKey(now), 1);
  return new Date(keyToLocalMs(key) - offset);
}
export function fmtTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + pad(m) + ' ' + ap;
}
export function fmtClock(date) {
  const p = parts(date);
  return fmtTime(pad(p.h) + ':' + pad(p.mi));
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function fmtKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return DAYS[keyDow(key)] + ' ' + d + ' ' + MONTHS[m - 1];
}
export function fmtLocalMs(ms) {
  const t = new Date(ms);
  const key = t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
  return fmtKey(key) + ', ' + fmtTime(pad(t.getUTCHours()) + ':' + pad(t.getUTCMinutes()));
}
export function money(points, perDollar) {
  return '$' + (points / (perDollar || 100)).toFixed(2);
}

// Which house a kid is at, at a given local ms.
export function houseAt(kidId, t, config) {
  const kid = config.kids[kidId];
  if (!kid) return null;
  if (kid.custody !== 'shared') return kid.house;
  for (const o of config.overrides || []) {
    if ((!o.kids || o.kids.includes(kidId)) && t >= parseLocal(o.from) && t < parseLocal(o.to)) return o.house;
  }
  const c = config.custody;
  const w = Math.floor((t - parseLocal(c.anchor)) / WEEK);
  return ((w % 2) + 2) % 2 === 0 ? c.firstHouse : c.secondHouse;
}
// When the shared kids next change house (local ms), from t.
export function nextChangeover(t, config) {
  const c = config.custody;
  const a = parseLocal(c.anchor);
  const w = Math.floor((t - a) / WEEK);
  return a + (w + 1) * WEEK;
}
export function isSchoolDay(key, config) {
  const dow = keyDow(key);
  if (dow === 0 || dow === 6) return false;
  if ((config.publicHolidays || []).includes(key)) return false;
  if ((config.pupilFreeDays || []).includes(key)) return false;
  return (config.terms || []).some((tr) => key >= tr.start && key <= tr.end);
}
// How a chore with several kids is shared:
//   'daily' = take turns each day; 'turns' = stays with one kid until they do it, then passes on;
//   anything else = each kid does their own.
export function shareMode(ch) {
  if (!ch.rotate || !ch.kids || ch.kids.length < 2) return 'each';
  return ch.rotate === 'turns' ? 'turns' : 'daily';
}
export function nextInTurn(ch, kidId) {
  const i = ch.kids.indexOf(kidId);
  return ch.kids[(i + 1) % ch.kids.length];
}
export const PARTS = [
  { id: 'morning', name: 'Morning', from: '00:00', icon: 'sun', colour: '#B45309', light: '#FEF3C7' },
  { id: 'afternoon', name: 'Afternoon', from: '12:00', icon: 'clock', colour: '#0369A1', light: '#E0F2FE' },
  { id: 'evening', name: 'Evening', from: '18:00', icon: 'moon', colour: '#4F46E5', light: '#E0E7FF' }
];
export function partOf(due) {
  let p = PARTS[0];
  for (const x of PARTS) if (due >= x.from) p = x;
  return p;
}
export function byTime(a, b) {
  const order = GROUPS.map((g) => g.id);
  return a.due.localeCompare(b.due) || order.indexOf(a.group) - order.indexOf(b.group) || a.name.localeCompare(b.name);
}
// Chores a kid should see on a given date, in time order.
// ctx.turns: { choreId: kid whose turn it is }, ctx.doneBy: { choreId: kid who did it on this date }
export function choresFor(kidId, key, chores, config, ctx) {
  const c = ctx || {};
  const turns = c.turns || {};
  const doneBy = c.doneBy || {};
  const dow = keyDow(key);
  const out = [];
  for (const ch of chores) {
    if (!ch.active || !ch.kids || !ch.kids.includes(kidId)) continue;
    if (!(ch.days || []).includes(dow)) continue;
    if (ch.schoolOnly && !isSchoolDay(key, config)) continue;
    if (ch.schoolNext && !isSchoolDay(addDays(key, 1), config)) continue;
    const t = keyToLocalMs(key, ch.due);
    if (houseAt(kidId, t, config) !== ch.house) continue;
    const mode = shareMode(ch);
    if (mode !== 'each') {
      const present = ch.kids.filter((k) => houseAt(k, t, config) === ch.house);
      if (present.length > 1) {
        let who;
        if (mode === 'daily') {
          const idx = (((dayNumber(key) + (ch.rotateOffset || 0)) % present.length) + present.length) % present.length;
          who = present[idx];
        } else if (doneBy[ch.id] && present.includes(doneBy[ch.id])) {
          who = doneBy[ch.id]; // already done today: stays with whoever did it until tomorrow
        } else {
          who = present.includes(turns[ch.id]) ? turns[ch.id] : present[0];
        }
        if (who !== kidId) continue;
      }
    }
    out.push(ch);
  }
  out.sort(byTime);
  return out;
}
export function completionId(kidId, key, choreId) { return kidId + '_' + key + '_' + choreId; }
export function isLate(ch, doneDate, key) {
  return localMs(doneDate) > keyToLocalMs(key, ch.due);
}
// Kids an adult device should list: shared kids, plus fixed kids who live at the adult's house.
export function kidsForHouse(house, config) {
  return Object.keys(config.kids).filter((k) => {
    const kid = config.kids[k];
    return kid.custody === 'shared' || kid.house === house;
  });
}
export function adultHouse(adultId, config) {
  for (const [h, v] of Object.entries(config.houses)) if ((v.admins || []).includes(adultId)) return h;
  return null;
}
export function kidColour(kidId, config, prefs) {
  return (prefs && prefs[kidId] && prefs[kidId].colour) || config.kids[kidId].colour || KID_COLOURS[0];
}
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- fairness: how many points a kid can earn if they do everything ----------
// Looks at the next `days` days. Shared chores ('daily' swap or 'turns') count as an equal share
// between the kids at that house, since over time they come out even. Chores marked fairness:true
// (the top-up) are left out unless includeTopUp is set.
export function expectedPoints(kidId, house, chores, config, startKey, days, includeTopUp) {
  const n = days || 28;
  let total = 0;
  let daysAt = 0;
  for (let i = 0; i < n; i++) {
    const key = addDays(startKey, i);
    if (houseAt(kidId, keyToLocalMs(key, '12:00'), config) === house) daysAt++;
    const dow = keyDow(key);
    for (const ch of chores) {
      if (ch.house !== house || !ch.active || !ch.kids || !ch.kids.includes(kidId)) continue;
      if (ch.fairness && !includeTopUp) continue;
      if (!(ch.days || []).includes(dow)) continue;
      if (ch.schoolOnly && !isSchoolDay(key, config)) continue;
      if (ch.schoolNext && !isSchoolDay(addDays(key, 1), config)) continue;
      const t = keyToLocalMs(key, ch.due);
      if (houseAt(kidId, t, config) !== house) continue;
      let share = 1;
      if (shareMode(ch) !== 'each') {
        const present = ch.kids.filter((k) => houseAt(k, t, config) === house).length;
        share = present > 1 ? 1 / present : 1;
      }
      total += ch.pts * share;
    }
  }
  const perDay = daysAt ? total / daysAt : 0;
  return { total, daysAt, perDay, perWeek: perDay * 7 };
}

// ---------- Magic button ----------
// Between `from` and `to` each night, a kid who has ticked every chore that day can tap the
// Magic button for bonus points. `streakDays` nights in a row earns an Above and Beyond star.
// Days with no chores at all neither count nor break the run.
export const MAGIC_DEFAULT = { pts: 10, from: '20:00', to: '22:00', streakDays: 30, kids: ['alex', 'emma'] };
export function magicCfg(config) { return Object.assign({}, MAGIC_DEFAULT, (config && config.magic) || {}); }
export function inMagicWindow(date, m) {
  const p = parts(date);
  const hm = pad(p.h) + ':' + pad(p.mi);
  return hm >= m.from && hm < m.to;
}
// Nights in a row, counting back from endKey. tapped: Set of date keys; hasChores(dateKey) -> boolean.
export function magicStreak(tapped, endKey, hasChores) {
  let n = 0;
  for (let i = 0; i < 800; i++) {
    const d = addDays(endKey, -i);
    if (tapped.has(d)) { n++; continue; }
    if (!hasChores(d)) continue;
    break;
  }
  return n;
}
export function weekStart(key) { return addDays(key, -((keyDow(key) + 6) % 7)); } // Monday

// ---------- Weekly check: points off if too few chores were done ----------
export const PENALTY_DEFAULT = { on: true, pct: 50, pts: 50, floor: true, kids: ['alex', 'emma'] };
export function penaltyCfg(config) { return Object.assign({}, PENALTY_DEFAULT, (config && config.penalty) || {}); }
export function msKey(ms) {
  const t = new Date(ms);
  return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
}
// The custody week (changeover to changeover) containing local time t.
export function penaltyPeriod(t, config) {
  const a = parseLocal(config.custody.anchor);
  const n = Math.floor((t - a) / WEEK);
  return { start: a + n * WEEK, end: a + (n + 1) * WEEK };
}
// Chores due for a kid between local times start and end, and how many were ticked.
// Take-turns chores only count when this kid did them (past turns aren't known). Optional chores don't count.
export function periodChores(kidId, start, end, chores, config, doneIds) {
  let due = 0;
  let done = 0;
  const req = chores.filter((c) => !c.optional);
  const fixed = req.filter((c) => shareMode(c) !== 'turns');
  const turnsCh = req.filter((c) => shareMode(c) === 'turns' && c.active && c.kids && c.kids.includes(kidId));
  const last = msKey(end - 1);
  for (let d = msKey(start); d <= last; d = addDays(d, 1)) {
    for (const ch of choresFor(kidId, d, fixed, config)) {
      const t = keyToLocalMs(d, ch.due);
      if (t < start || t >= end) continue;
      due++;
      if (doneIds.has(completionId(kidId, d, ch.id))) done++;
    }
    for (const ch of turnsCh) {
      const t = keyToLocalMs(d, ch.due);
      if (t < start || t >= end) continue;
      if (doneIds.has(completionId(kidId, d, ch.id))) { due++; done++; }
    }
  }
  return { due, done };
}
