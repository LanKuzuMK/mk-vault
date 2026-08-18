import { fromRow, json, parseProject, requireAdmin, type Env, writeProject } from "../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const result = await env.VAULT_DB.prepare(
    "SELECT id, url, title, category, note, is_published, featured_rank, created_at, updated_at FROM projects ORDER BY created_at DESC",
  ).all();
  return json((result.results ?? []).map((row) => fromRow(row)));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const project = parseProject(await request.json().catch(() => null));
  if (!project) return json({ error: "Provide a valid project URL, title, category, and optional note." }, 400);

  if (project.featuredRank > 0) {
    await env.VAULT_DB.prepare("UPDATE projects SET featured_rank = 0, updated_at = ? WHERE featured_rank = ? AND id != ?")
      .bind(project.updatedAt, project.featuredRank, project.id).run();
  }
  await writeProject(env, project);
  return json(project, 201);
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "A project ID is required." }, 400);
  await env.VAULT_DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
  return json({ success: true });
};
