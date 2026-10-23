/* Spartan 2027 — training log storage.
 *
 * Every record is an "entry" { id, kind, date, updatedAt, ... } — a finished
 * session, a day's rep counts, a mobility routine, a benchmark, an activity.
 * Entries live in localStorage first, so the app works with no signal, and are
 * pushed to the BlueStep endpoint after. Deletes are tombstones
 * ({ id, deleted: true }) so a restore on a new phone does not resurrect them.
 *
 * The endpoint needs a key. It is typed into Settings once and kept on the
 * phone, never committed: this repo is public.
 */

var Store = (function () {
  "use strict";

  var LS_ENTRIES = "spartan27.entries.v1";
  var LS_DIRTY = "spartan27.dirty.v1";
  var LS_CONFIG = "spartan27.config.v1";
  var LS_SYNCED = "spartan27.synced.v1";

  var DEFAULT_URL = "https://beh.bluestep.net/b/spartandata";

  function lsGet(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function config() {
    var c = lsGet(LS_CONFIG, {});
    return { url: c.url || DEFAULT_URL, key: c.key || "" };
  }
  function setConfig(patch) {
    var c = Object.assign(config(), patch || {});
    lsSet(LS_CONFIG, c);
    return c;
  }
  function configured() { var c = config(); return !!(c.url && c.key); }

  function uid(prefix) {
    return (prefix || "e") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------- local ---------- */
  var cache = null;
  function map() {
    if (!cache) {
      cache = {};
      lsGet(LS_ENTRIES, []).forEach(function (e) { if (e && e.id) cache[e.id] = e; });
    }
    return cache;
  }
  function save() {
    var m = map();
    lsSet(LS_ENTRIES, Object.keys(m).map(function (k) { return m[k]; }));
  }
  function dirty() { return lsGet(LS_DIRTY, []); }
  function markDirty(id) {
    var d = dirty();
    if (d.indexOf(id) === -1) { d.push(id); lsSet(LS_DIRTY, d); }
  }

  var listeners = [];
  function changed() { listeners.forEach(function (fn) { try { fn(); } catch (e) { } }); }

  /* ---------- public ---------- */
  function all() {
    var m = map();
    return Object.keys(m).map(function (k) { return m[k]; }).filter(function (e) { return !e.deleted; });
  }
  function get(id) { var e = map()[id]; return e && !e.deleted ? e : null; }
  function byKind(kind) { return all().filter(function (e) { return e.kind === kind; }); }

  function put(entry) {
    entry.id = entry.id || uid(entry.kind ? entry.kind.charAt(0) : "e");
    entry.updatedAt = new Date().toISOString();
    map()[entry.id] = entry;
    save();
    markDirty(entry.id);
    changed();
    pushSoon();
    return entry;
  }
  function remove(id) {
    if (!map()[id]) return;
    map()[id] = { id: id, deleted: true, updatedAt: new Date().toISOString() };
    save();
    markDirty(id);
    changed();
    pushSoon();
  }

  /* ---------- network ---------- */
  function call(method, body) {
    var c = config();
    var u = c.url + (c.url.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now();
    var opts = { method: method, cache: "no-store" };
    if (method === "GET") {
      u += "&k=" + encodeURIComponent(c.key);
    } else {
      /* text/plain keeps this a "simple" request: BlueStep endpoints cannot
         answer a CORS preflight, so application/json would break every write. */
      opts.headers = { "Content-Type": "text/plain" };
      body.k = c.key;
      opts.body = JSON.stringify(body);
    }
    return fetch(u, opts).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      /* The endpoint always answers 200 and reports failure in the envelope. */
      if (!data || data.success === false) throw new Error((data && data.error) || "rejected");
      return data;
    });
  }

  var pushing = null;
  function push() {
    if (!configured()) return Promise.resolve(0);
    if (pushing) return pushing;
    var ids = dirty();
    if (!ids.length) return Promise.resolve(0);
    var m = map();
    var batch = ids.slice(0, 100).map(function (id) { return m[id]; }).filter(Boolean);
    pushing = call("POST", { action: "put", entries: batch }).then(function () {
      var sent = {};
      batch.forEach(function (e) { sent[e.id] = e.updatedAt; });
      /* Only clear ids that were not edited again while the request was out. */
      var left = dirty().filter(function (id) { return !(sent[id] && map()[id] && map()[id].updatedAt === sent[id]); });
      lsSet(LS_DIRTY, left);
      lsSet(LS_SYNCED, new Date().toISOString());
      pushing = null;
      return left.length ? push() : batch.length;
    }, function (err) { pushing = null; throw err; });
    return pushing;
  }

  var timer = 0;
  function pushSoon() {
    clearTimeout(timer);
    timer = setTimeout(function () { push().catch(function () { }); }, 800);
  }

  /* Push what is waiting, then pull everything and merge: newest updatedAt
     wins, and an entry still waiting to go up is never overwritten. */
  function sync() {
    if (!configured()) return Promise.reject(new Error("Add your sync key in Settings."));
    return push().then(function () { return call("GET"); }).then(function (data) {
      var m = map(), waiting = {};
      dirty().forEach(function (id) { waiting[id] = true; });
      (data.entries || []).forEach(function (e) {
        if (!e || !e.id || waiting[e.id]) return;
        var mine = m[e.id];
        if (!mine || String(e.updatedAt || "") > String(mine.updatedAt || "")) m[e.id] = e;
      });
      save();
      lsSet(LS_SYNCED, new Date().toISOString());
      changed();
      return (data.entries || []).length;
    });
  }

  function status() {
    return {
      configured: configured(),
      pending: dirty().length,
      count: all().length,
      lastSync: lsGet(LS_SYNCED, null),
    };
  }

  function exportJSON() {
    var m = map();
    return JSON.stringify({ app: "spartan-2027", exported: new Date().toISOString(),
      entries: Object.keys(m).map(function (k) { return m[k]; }) });
  }
  function importJSON(text) {
    var data = JSON.parse(text);
    var list = Array.isArray(data) ? data : data.entries;
    if (!Array.isArray(list)) throw new Error("That file has no entries.");
    var m = map(), n = 0;
    list.forEach(function (e) {
      if (!e || !e.id) return;
      var mine = m[e.id];
      if (!mine || String(e.updatedAt || "") > String(mine.updatedAt || "")) { m[e.id] = e; markDirty(e.id); n++; }
    });
    save();
    changed();
    pushSoon();
    return n;
  }

  return {
    all: all, get: get, byKind: byKind, put: put, remove: remove, uid: uid,
    sync: sync, push: push, status: status, config: config, setConfig: setConfig,
    configured: configured, exportJSON: exportJSON, importJSON: importJSON,
    onChange: function (fn) { listeners.push(fn); },
  };
})();
