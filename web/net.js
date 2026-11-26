// window.Net — talks to the mist-game function, listens on Supabase Realtime, polls as fallback.
(function () {
  const B = window.BACKEND;
  const LS = "mist.session";
  let session = null; // {code, playerId, token, name}
  let listeners = [];
  let lastV = -1, lastView = null;
  let pollTimer = null, channel = null, rt = null, inflight = null;

  function load() { try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch { return null; } }
  function store(s) { try { s ? localStorage.setItem(LS, JSON.stringify(s)) : localStorage.removeItem(LS); } catch {} }

  async function call(body) {
    try {
      const r = await fetch(B.fnUrl, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: B.anonKey },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({ ok: false, error: "응답을 읽지 못했어요" }));
      return j;
    } catch (e) {
      return { ok: false, error: "인터넷 연결을 확인해 주세요", offline: true };
    }
  }

  function emit(view) {
    if (!view) return;
    if (lastView && view.v < lastV && view.code === lastView.code) return; // stale
    const changed = !lastView || view.v !== lastV || JSON.stringify(view) !== JSON.stringify(lastView);
    lastV = view.v; lastView = view;
    if (changed) listeners.forEach((cb) => { try { cb(view); } catch (e) { console.error(e); } });
  }

  async function refresh() {
    if (!session) return;
    if (inflight) return inflight;
    inflight = call({ action: "state", code: session.code, playerId: session.playerId, token: session.token })
      .then((j) => {
        if (j.ok) emit(j.view);
        else if (j.kicked) { drop(); listeners.forEach((cb) => cb(null, j.error)); }
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
      if (!session) return { ok: false, error: "방에 들어가 있지 않아요" };
      const j = await call({ action, code: session.code, playerId: session.playerId, token: session.token, ...params });
      if (j.view) emit(j.view);
      if (j.kicked) { drop(); listeners.forEach((cb) => cb(null, j.error)); }
      if (action === "leave" && j.ok) { drop(); listeners.forEach((cb) => cb(null)); }
      return j;
    },
    refresh,
    leave() { drop(); listeners.forEach((cb) => cb(null)); },
    lastSession: load,
  };
})();
