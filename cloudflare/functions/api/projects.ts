import { fromRow, json, type Env } from "./_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.VAULT_DB.prepare(
    `SELECT id, url, title, category, note, featured_rank, created_at, updated_at
     FROM projects WHERE is_published = 1
     ORDER BY CASE WHEN featured_rank > 0 THEN 0 ELSE 1 END, featured_rank ASC, created_at DESC`,
  ).all();

  return json((result.results ?? []).map((row) => {
    const project = fromRow({ ...row, is_published: 1 });
    return { id: project.id, url: project.url, title: project.title, category: project.category, note: project.note, featuredRank: project.featuredRank };
  }));
};
