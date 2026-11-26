// Supabase Edge Function "mist-game" — the only authority for 빛의 원정대.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import * as E from "./engine.js";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(URL_, KEY, { auth: { persistSession: false } });
const TABLE = "mist_rooms";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });
}

async function load(code: string) {
  const { data, error } = await sb.from(TABLE).select("state, v").eq("code", code).maybeSingle();
  if (error) throw error;
  return data as { state: any; v: number } | null;
}

async function save(code: string, state: any, prevV: number) {
  const { data, error } = await sb
    .from(TABLE)
    .update({ state, v: state.v, updated_at: new Date().toISOString() })
    .eq("code", code)
    .eq("v", prevV)
    .select("code");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

async function broadcast(code: string, v: number) {
  try {
    await fetch(`${URL_}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: `mist:${code}`, event: "update", payload: { v }, private: false }] }),
    });
  } catch (_) { /* clients also poll */ }
}

function normCode(c: unknown) {
  return String(c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

async function handle(body: any) {
  const action = String(body.action ?? "");
  const now = Date.now();

  if (action === "create") {
    // light cleanup of stale rooms
    if (Math.random() < 0.1) await sb.from(TABLE).delete().lt("updated_at", new Date(now - 3 * 864e5).toISOString());
    for (let i = 0; i < 6; i++) {
      const code = E.randCode();
      const r: any = E.createState(code, body.name, { now });
      if (r.error) return { ok: false, error: r.error };
      const { error } = await sb.from(TABLE).insert({ code, state: r.state, v: r.state.v });
      if (error) {
        if ((error as any).code === "23505") continue;
        throw error;
      }
      return { ok: true, code, playerId: r.player.id, token: r.player.token, view: E.viewFor(r.state, r.player.id, now) };
    }
    return { ok: false, error: "방을 만들지 못했어요. 다시 시도해 주세요" };
  }

  const code = normCode(body.code);
  if (!code) return { ok: false, error: "방 코드를 입력해 주세요" };

  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await load(code);
    if (!row) return { ok: false, error: "그런 방이 없어요. 코드를 확인해 주세요" };
    const state = row.state;
    const prevV = row.v;

    if (action === "join") {
      const r: any = E.joinPlayer(state, body.name, body.token, { now });
      if (r.error) return { ok: false, error: r.error };
      if (r.changed) state.v += 1;
      const ok = await save(code, state, prevV);
      if (!ok) continue;
      if (r.changed) broadcast(code, state.v);
      return { ok: true, code, playerId: r.player.id, token: r.player.token, view: E.viewFor(state, r.player.id, now) };
    }

    const me = state.players.find((p: any) => p.id === body.playerId);
    if (!me || me.token !== body.token) return { ok: false, error: "다시 입장해 주세요", kicked: true };

    const res: any = E.applyAction(state, { ...body, playerId: me.id }, { now });
    if (res.error) return { ok: false, error: res.error, view: E.viewFor(state, me.id, now) };
    const changed = state.v !== prevV;
    // state polls only refresh lastSeen; write those at most every 5s to keep DB light
    if (!changed && now - (me._seenSaved ?? 0) < 5000) return { ok: true, view: E.viewFor(state, me.id, now) };
    if (!changed) me._seenSaved = now;
    const ok = await save(code, state, prevV);
    if (!ok) {
      if (!changed) return { ok: true, view: E.viewFor(state, me.id, now) };
      continue;
    }
    if (changed) broadcast(code, state.v);
    return { ok: true, view: action === "leave" ? null : E.viewFor(state, me.id, now) };
  }
  return { ok: false, error: "동시에 너무 많은 요청이 왔어요. 다시 눌러 주세요" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  let body: any;
  try {
    const text = await req.text();
    if (text.length > 8000) return json({ ok: false, error: "too large" }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "bad json" }, 400);
  }
  try {
    return json(await handle(body));
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "서버 오류가 났어요. 잠시 후 다시 시도해 주세요" }, 500);
  }
});
