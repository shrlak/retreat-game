// Supabase Edge Function "mist-game". All logic lives in handler.js + engine.js.
// When deploying through the Supabase MCP, this import may point at a pinned jsDelivr URL of this repo instead.
import { makeHandler } from "./handler.js";
Deno.serve(makeHandler({ url: Deno.env.get("SUPABASE_URL")!, key: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! }));
