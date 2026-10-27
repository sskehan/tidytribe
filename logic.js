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
export const KID_COLOURS = ['#C2410C', '#1D4ED8', '#7C3AED', '#0F766E', '#BE185D', '#15803D', '#B45309', '#334155'];
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
