// Tidy Tribe — data layer. Uses Firebase when firebase-config.js is filled in,
// otherwise a demo store saved on this device only (for trying the app out).
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
export const EMAIL_DOMAIN = '@tidytribe.app';
export const COLLECTIONS = ['config', 'chores', 'rewards', 'balances', 'completions', 'requests', 'stars', 'adjustments', 'prefs', 'turns', 'meds'];

function isFilled(cfg) {
  return cfg && cfg.apiKey && !/PASTE/i.test(cfg.apiKey) && cfg.projectId && !/PASTE/i.test(cfg.projectId);
}

export async function createStore(fbConfig) {
  if (isFilled(fbConfig)) return firebaseStore(fbConfig);
  return demoStore();
}

// ---------- Firebase ----------
async function firebaseStore(cfg) {
  const [appM, authM, fsM] = await Promise.all([
    import(FB + 'firebase-app.js'),
    import(FB + 'firebase-auth.js'),
    import(FB + 'firebase-firestore.js')
  ]);
  const app = appM.initializeApp(cfg);
  const auth = authM.getAuth(app);
  let db;
  try {
    db = fsM.initializeFirestore(app, { localCache: fsM.persistentLocalCache({ tabManager: fsM.persistentMultipleTabManager() }) });
  } catch (e) {
    db = fsM.getFirestore(app);
  }
  const conv = (v) => {
    if (v instanceof fsM.Timestamp) return v.toDate();
    if (Array.isArray(v)) return v.map(conv);
    if (v && typeof v === 'object' && v.constructor === Object) {
      const o = {};
      for (const k of Object.keys(v)) o[k] = conv(v[k]);
      return o;
    }
    return v;
  };
  const unconv = (v) => {
    if (v instanceof Date) return fsM.Timestamp.fromDate(v);
    if (v && v.__inc !== undefined) return fsM.increment(v.__inc);
    if (Array.isArray(v)) return v.map(unconv);
    if (v && typeof v === 'object' && v.constructor === Object) {
      const o = {};
      for (const k of Object.keys(v)) o[k] = unconv(v[k]);
      return o;
    }
    return v;
  };
  const ref = (path) => fsM.doc(db, ...path.split('/'));
  function buildQuery(name, spec) {
    const parts = [];
    if (spec.where) parts.push(fsM.where(spec.where[0], spec.where[1], spec.where[2]));
    if (spec.orderBy) parts.push(fsM.orderBy(spec.orderBy[0], spec.orderBy[1] || 'asc'));
    if (spec.limit) parts.push(fsM.limit(spec.limit));
    return fsM.query(fsM.collection(db, name), ...parts);
  }
  return {
    mode: 'firebase',
    onAuth(cb) {
      return authM.onAuthStateChanged(auth, (u) => cb(u && u.email ? u.email.split('@')[0].toLowerCase() : null));
    },
    async signIn(userId, password) {
      await authM.signInWithEmailAndPassword(auth, userId + EMAIL_DOMAIN, password);
    },
    async signOut() { await authM.signOut(auth); },
    listen(name, spec, cb, onErr) {
      if (spec && spec.doc) {
        return fsM.onSnapshot(ref(name + '/' + spec.doc), (s) => cb(s.exists() ? conv(s.data()) : null), (e) => onErr && onErr(e));
      }
      return fsM.onSnapshot(buildQuery(name, spec || {}), (s) => {
        const out = [];
        s.forEach((d) => out.push(Object.assign({ id: d.id }, conv(d.data()))));
        cb(out, s.metadata.hasPendingWrites, s.metadata.fromCache);
      }, (e) => onErr && onErr(e));
    },
    async batch(ops) {
      const b = fsM.writeBatch(db);
      for (const o of ops) {
        if (o.op === 'set') b.set(ref(o.path), unconv(o.data));
        else if (o.op === 'update') b.update(ref(o.path), unconv(o.data));
        else if (o.op === 'delete') b.delete(ref(o.path));
      }
      // Resolves when the server confirms. Offline, the change is already shown and will sync later.
      return b.commit();
    },
    async exists(path) {
      // Asks the server (not the offline copy), so a missing document really is missing.
      const s = await fsM.getDocFromServer(ref(path));
      return s.exists();
    },
    async dumpAll() {
      const out = {};
      for (const name of COLLECTIONS) {
        try {
          const s = await fsM.getDocs(fsM.collection(db, name));
          out[name] = {};
          s.forEach((d) => { out[name][d.id] = conv(d.data()); });
        } catch (e) {
          // Some adults can't read everything (e.g. another house's private notes). Leave it out of this copy.
          if (!(e && e.code === 'permission-denied')) throw e;
        }
      }
      return out;
    }
  };
}

// ---------- Demo (this device only) ----------
function demoStore() {
  const KEY = 'tidytribe-demo-v1';
  let data;
  const revive = (v) => {
    if (v && typeof v === 'object' && v.__date) return new Date(v.__date);
    if (Array.isArray(v)) return v.map(revive);
    if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = revive(v[k]); return o; }
    return v;
  };
  const freeze = (v) => {
    if (v instanceof Date) return { __date: v.toISOString() };
    if (Array.isArray(v)) return v.map(freeze);
    if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = freeze(v[k]); return o; }
    return v;
  };
  try { data = revive(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { data = {}; }
  for (const n of COLLECTIONS) data[n] = data[n] || {};
  const listeners = new Set();
  const authCbs = new Set();
  let user = null;
  try { user = localStorage.getItem(KEY + '-user'); } catch (e) { user = null; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(freeze(data))); } catch (e) { /* storage full or blocked */ } };
  const clone = (v) => revive(JSON.parse(JSON.stringify(freeze(v))));
  const cmp = (a, op, b) => {
    const x = a instanceof Date ? a.getTime() : a;
    const y = b instanceof Date ? b.getTime() : b;
    switch (op) {
      case '==': return x === y;
      case '!=': return x !== y;
      case '>=': return x >= y;
      case '<=': return x <= y;
      case '>': return x > y;
      case '<': return x < y;
      case 'in': return Array.isArray(y) && y.includes(x);
      default: return false;
    }
  };
  function run(l) {
    if (l.spec && l.spec.doc) {
      const d = data[l.name][l.spec.doc];
      l.cb(d ? clone(d) : null);
      return;
    }
    let rows = Object.entries(data[l.name]).map(([id, d]) => Object.assign({ id }, clone(d)));
    const s = l.spec || {};
    if (s.where) rows = rows.filter((r) => cmp(r[s.where[0]], s.where[1], s.where[2]));
    if (s.orderBy) {
      const [f, dir] = s.orderBy;
      rows.sort((a, b) => {
        const x = a[f] instanceof Date ? a[f].getTime() : a[f];
        const y = b[f] instanceof Date ? b[f].getTime() : b[f];
        return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'desc' ? -1 : 1);
      });
    }
    if (s.limit) rows = rows.slice(0, s.limit);
    l.cb(rows, false, false);
  }
  function setPath(obj, path, val) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) { o[keys[i]] = o[keys[i]] && typeof o[keys[i]] === 'object' ? o[keys[i]] : {}; o = o[keys[i]]; }
    const last = keys[keys.length - 1];
    if (val && val.__inc !== undefined) o[last] = (Number(o[last]) || 0) + val.__inc;
    else o[last] = val;
  }
  function resolveIncs(v) {
    if (v && v.__inc !== undefined) return v.__inc;
    if (v instanceof Date || Array.isArray(v) || !v || typeof v !== 'object') return v;
    const o = {}; for (const k of Object.keys(v)) o[k] = resolveIncs(v[k]); return o;
  }
  return {
    mode: 'demo',
    onAuth(cb) { authCbs.add(cb); setTimeout(() => cb(user), 0); return () => authCbs.delete(cb); },
    async signIn(userId) {
      user = userId;
      try { localStorage.setItem(KEY + '-user', userId); } catch (e) { /* ignore */ }
      authCbs.forEach((cb) => cb(user));
    },
    async signOut() {
      user = null;
      try { localStorage.removeItem(KEY + '-user'); } catch (e) { /* ignore */ }
      authCbs.forEach((cb) => cb(null));
    },
    listen(name, spec, cb) {
      const l = { name, spec, cb };
      listeners.add(l);
      setTimeout(() => run(l), 0);
      return () => listeners.delete(l);
    },
    async batch(ops) {
      for (const o of ops) {
        const [col, id] = o.path.split('/');
        if (o.op === 'set') data[col][id] = clone(resolveIncs(o.data));
        else if (o.op === 'update') {
          if (!data[col][id]) throw new Error('No document to update: ' + o.path);
          for (const [k, v] of Object.entries(o.data)) setPath(data[col][id], k, v);
        } else if (o.op === 'delete') delete data[col][id];
      }
      save();
      listeners.forEach(run);
    },
    async exists(path) { const [col, id] = path.split('/'); return !!data[col][id]; },
    async dumpAll() { return clone(data); },
    resetDemo() { for (const n of COLLECTIONS) data[n] = {}; save(); listeners.forEach(run); }
  };
}

export const inc = (n) => ({ __inc: n });
