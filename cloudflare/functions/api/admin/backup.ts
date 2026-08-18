import { json, parseProject, requireAdmin, type Env, writeProject } from "../_shared";

const latestKey = "vaults/1/latest.json";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const object = await env.VAULT_BACKUPS.get(latestKey);
  if (!object) return json({ error: "No remote backup has been sealed yet." }, 404);
  return new Response(object.body, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const body = await request.json().catch(() => null) as { entries?: unknown } | null;
  const rawEntries = Array.isArray(body?.entries) ? body.entries : null;
  const entries = rawEntries?.map(parseProject).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)) ?? [];
  if (!rawEntries || entries.length !== rawEntries.length || entries.length > 2500) {
    return json({ error: "The backup must contain valid project-link records." }, 400);
  }
  const exportedAt = new Date().toISOString();
  const payload = JSON.stringify({ schemaVersion: 1, exportedAt, entries });
  const historical = `vaults/1/history/${exportedAt.replace(/[:.]/g, "-")}.json`;
  await Promise.all([
    env.VAULT_BACKUPS.put(latestKey, payload, { httpMetadata: { contentType: "application/json", cacheControl: "no-store" } }),
    env.VAULT_BACKUPS.put(historical, payload, { httpMetadata: { contentType: "application/json", cacheControl: "no-store" } }),
  ]);
  return json({ savedAt: exportedAt, entryCount: entries.length });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const object = await env.VAULT_BACKUPS.get(latestKey);
  if (!object) return json({ error: "No remote backup has been sealed yet." }, 404);
  const data = await object.json<{ entries?: unknown }>();
  const rawEntries = Array.isArray(data.entries) ? data.entries : null;
  const entries = rawEntries?.map(parseProject).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)) ?? [];
  if (!rawEntries || entries.length !== rawEntries.length) return json({ error: "The remote backup is not valid." }, 422);
  await env.VAULT_DB.prepare("DELETE FROM projects").run();
  await env.VAULT_DB.batch(entries.map((entry) => env.VAULT_DB.prepare(
    "INSERT INTO projects (id, url, title, category, note, is_published, featured_rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(entry.id, entry.url, entry.title, entry.category, entry.note, entry.isPublished ? 1 : 0, entry.featuredRank, entry.createdAt, entry.updatedAt)));
  return json({ restoredAt: new Date().toISOString(), entryCount: entries.length });
};
