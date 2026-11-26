// window.Net — talks to the mist-game function, listens on Supabase Realtime, polls as fallback.
(function () {
  const B = window.BACKEND;
  const LS = "mist.session" + (new URLSearchParams(location.search).get("slot") || "");
  let session = null; // {code, playerId, token, name}
  let listeners = [];
  let lastV = -1, lastView = null;
  let pollTimer = null, channel = null, rt = null, inflight = null;

  function load() { try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch { return null; } }
  function store(s) { try { s ? localStorage.setItem(LS, JSON.stringify(s)) : localStorage.removeItem(LS); } catch {} }

  // Server clock estimate, so every phone starts a scene transition at the same moment:
  // serverTime ≈ Date.now() + clockOffset. Keep the sample with the shortest round trip (least error).
  let clockOffset = 0, clockRtt = Infinity, clockAt = 0;
  function sampleClock(t0, t1, serverNow) {
    if (typeof serverNow !== "number") return;
    const rtt = t1 - t0;
    // older samples slowly lose priority so a drifting phone clock gets corrected
    const aged = clockRtt + (t1 - clockAt) / 60;
    if (rtt <= aged) { clockOffset = serverNow - (t0 + t1) / 2; clockRtt = rtt; clockAt = t1; }
  }
  const serverTime = () => Date.now() + clockOffset;
  // language: "ko" | "en", kept on this phone
  const LANG_KEY = "mist.lang";
  function getLang() { try { return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ko"; } catch { return "ko"; } }
  function setLang(l) { try { localStorage.setItem(LANG_KEY, l === "en" ? "en" : "ko"); } catch {} document.documentElement.lang = l === "en" ? "en" : "ko"; }
  // the message to show for a failed result, in the chosen language
  const errorText = (r) => (r ? (getLang() === "en" ? r.errorEn || r.error : r.error) : "");

  async function call(body) {
    try {
      const t0 = Date.now();
      const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = ctl && setTimeout(() => ctl.abort(), 15000); // never leave a tap hanging
      const r = await fetch(B.fnUrl, {
        signal: ctl ? ctl.signal : undefined,
        method: "POST",
        headers: { "content-type": "application/json", apikey: B.anonKey },
        body: JSON.stringify(body),
      });
      if (timer) clearTimeout(timer);
      const j = await r.json().catch(() => ({ ok: false, error: "응답을 읽지 못했어요", errorKey: "badResponse", errorEn: "Couldn't read the server's answer" }));
      if (j && j.view) {
        sampleClock(t0, Date.now(), j.view.serverNow);
        j.view.serverOffsetMs = Math.round(clockOffset);
      }
      return j;
    } catch (e) {
      return { ok: false, error: "인터넷 연결을 확인해 주세요", errorKey: "offline", errorEn: "Please check your internet connection", offline: true };
    }
  }

  function emit(view) {
    if (!view) return;
    if (lastView && view.v < lastV && view.code === lastView.code) return; // stale
    const same = (a, b) => JSON.stringify({ ...a, serverNow: 0, serverOffsetMs: 0 }) === JSON.stringify({ ...b, serverNow: 0, serverOffsetMs: 0 });
    const changed = !lastView || view.v !== lastV || !same(view, lastView);
    lastV = view.v; lastView = view;
    if (changed) listeners.forEach((cb) => { try { cb(view); } catch (e) { console.error(e); } });
  }

  async function refresh() {
    if (!session) return;
    if (inflight) return inflight;
    inflight = call({ action: "state", code: session.code, playerId: session.playerId, token: session.token })
      .then((j) => {
        if (j.ok) emit(j.view);
        else if (j.kicked) { drop(); listeners.forEach((cb) => cb(null, errorText(j))); }
        return j;
      })
      .finally(() => { inflight = null; });
    return inflight;
  }

  function subscribe() {
    unsubscribe();
    pollTimer = setInterval(refresh, 4000);
    document.addEventListener("visibilitychange", onVis);
    try {
      if (window.supabase && window.supabase.createClient) {
        rt = rt || window.supabase.createClient(B.supabaseUrl, B.anonKey, { auth: { persistSession: false } });
        channel = rt.channel("mist:" + session.code, { config: { broadcast: { self: false } } });
        channel.on("broadcast", { event: "update" }, (m) => {
          if (!m.payload || m.payload.v !== lastV) refresh();
        }).subscribe();
      }
    } catch (e) { console.warn("realtime off", e); }
  }
  function onVis() { if (document.visibilityState === "visible") refresh(); }
  function unsubscribe() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    document.removeEventListener("visibilitychange", onVis);
    if (channel && rt) { try { rt.removeChannel(channel); } catch {} }
    channel = null;
  }
  function drop() { unsubscribe(); session = null; store(null); lastV = -1; lastView = null; }

  async function enter(j, name) {
    if (!j.ok) return j;
    session = { code: j.code, playerId: j.playerId, token: j.token, name };
    store(session);
    lastV = -1; lastView = null;
    subscribe();
    emit(j.view);
    return j;
  }

  window.Net = {
    get session() { return session; },
    get view() { return lastView; },
    serverTime, getLang, setLang, errorText,
    get clockOffset() { return clockOffset; },
    onView(cb) { listeners.push(cb); },
    async create(name) { return enter(await call({ action: "create", name }), name); },
    async join(code, name) {
      const prev = load();
      const token = prev && prev.code === String(code).toUpperCase() ? prev.token : undefined;
      return enter(await call({ action: "join", code, name, token }), name);
    },
    async resume() {
      const prev = load();
      if (!prev) return { ok: false };
      const j = await call({ action: "join", code: prev.code, name: prev.name, token: prev.token });
      if (!j.ok) { if (!j.offline) store(null); return j; }
      return enter(j, prev.name);
    },
    async act(action, params = {}) {
      if (!session) return { ok: false, error: "방에 들어가 있지 않아요", errorKey: "noSession", errorEn: "You're not in a room" };
      const j = await call({ action, code: session.code, playerId: session.playerId, token: session.token, ...params });
      if (j.view) emit(j.view);
      if (j.kicked) { drop(); listeners.forEach((cb) => cb(null, errorText(j))); }
      if (action === "leave" && j.ok) { drop(); listeners.forEach((cb) => cb(null)); }
      return j;
    },
    refresh,
    leave() { drop(); listeners.forEach((cb) => cb(null)); },
    lastSession: load,
  };
})();
