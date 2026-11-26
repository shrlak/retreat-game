// Glue: Net -> UI. Falls back to the plain dev UI if ui/ui.js is missing.
(function () {
  const root = document.getElementById("app");
  const forceDev = new URLSearchParams(location.search).has("dev");
  const UIimpl = (!forceDev && window.UI) || window.DevUI;
  const N = window.Net;
  const api = {
    create: (name) => N.create(name),
    join: (code, name) => N.join(code, name),
    ready: (b) => N.act("ready", { ready: !!b }),
    settings: (s) => N.act("settings", { settings: s }),
    kick: (id) => N.act("kick", { targetId: id }),
    start: () => N.act("start"),
    ack: () => N.act("ack"),
    skipReveal: () => N.act("skipReveal"),
    propose: (ids, excaliburTo) => N.act("propose", excaliburTo ? { team: ids, excaliburTo } : { team: ids }),
    excalibur: (id) => N.act("excalibur", id ? { targetId: id } : {}),
    allowRejoin: (id) => N.act("allowRejoin", { targetId: id }),
    claimHost: () => N.act("claimHost"),
    vote: (b) => N.act("vote", { approve: !!b }),
    quest: (b) => N.act("quest", { success: !!b }),
    lady: (id) => N.act("lady", { targetId: id }),
    assassinate: (id) => N.act("assassinate", { targetId: id }),
    restart: () => N.act("restart"),
    leave: () => (N.view && N.view.phase === "lobby" ? N.act("leave") : (N.leave(), Promise.resolve({ ok: true }))),
    home: () => { N.leave(); return Promise.resolve({ ok: true }); },
    lastSession: () => N.lastSession(),
    resume: () => N.resume(),
  };
  // wrap: show errors as toasts
  for (const k of Object.keys(api)) {
    const f = api[k];
    api[k] = async (...a) => {
      const r = await f(...a);
      if (r && r.ok === false && r.error && UIimpl.toast) UIimpl.toast(r.error);
      return r;
    };
  }
  UIimpl.init(root, api, window.THEME, window.GUIDE || null);
  N.onView((view, msg) => {
    UIimpl.render(view);
    if (msg && UIimpl.toast) UIimpl.toast(msg);
  });
  const params = new URLSearchParams(location.search);
  const urlCode = (params.get("code") || "").toUpperCase();
  UIimpl.render(null, { code: urlCode });
  const prev = N.lastSession();
  if (prev) N.resume();
})();
