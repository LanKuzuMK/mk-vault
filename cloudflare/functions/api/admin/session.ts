import { authenticateOwner, clearSessionCookie, createAdminSession, hasAdminSession, json, sessionCookie, type Env } from "../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => json({ authenticated: await hasAdminSession(request, env) });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!(await authenticateOwner(password, env))) return json({ error: "The administrator password is not valid." }, 401);
  return new Response(JSON.stringify({ authenticated: true }), {
    headers: { "content-type": "application/json; charset=utf-8", "set-cookie": sessionCookie(await createAdminSession(env)), "cache-control": "no-store" },
  });
};

export const onRequestDelete: PagesFunction<Env> = async () => new Response(JSON.stringify({ authenticated: false }), {
  headers: { "content-type": "application/json; charset=utf-8", "set-cookie": clearSessionCookie(), "cache-control": "no-store" },
});
