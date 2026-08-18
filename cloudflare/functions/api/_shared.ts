export type Category = "Game" | "Tool" | "App" | "Portfolio" | "Other";

export interface Env {
  VAULT_DB: D1Database;
  VAULT_BACKUPS: R2Bucket;
  OWNER_EMAIL: string;
  MK_VAULT_ADMIN_PASSWORD: string;
}

export type ProjectRecord = {
  id: string;
  url: string;
  title: string;
  category: Category;
  note: string;
  isPublished: boolean;
  featuredRank: number;
  createdAt: string;
  updatedAt: string;
};

const categories = new Set<Category>(["Game", "Tool", "App", "Portfolio", "Other"]);

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function fromRow(row: Record<string, unknown>): ProjectRecord {
  return {
    id: String(row.id),
    url: String(row.url),
    title: String(row.title),
    category: row.category as Category,
    note: String(row.note ?? ""),
    isPublished: Number(row.is_published) === 1,
    featuredRank: Number(row.featured_rank ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function parseProject(value: unknown): ProjectRecord | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<ProjectRecord>;
  const url = typeof item.url === "string" ? item.url.trim() : "";
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const category = item.category as Category;
  const note = typeof item.note === "string" ? item.note.trim().slice(0, 160) : "";
  const featuredRank = Number(item.featuredRank ?? 0);
  const isPublished = Boolean(item.isPublished);
  if (!url || !title || !categories.has(category)) return null;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return null;
  } catch {
    return null;
  }
  const now = new Date().toISOString();
  return {
    id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
    url,
    title: title.slice(0, 80),
    category,
    note,
    isPublished,
    featuredRank: [0, 1, 2, 3].includes(featuredRank) ? featuredRank : 0,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : now,
    updatedAt: now,
  };
}

const sessionName = "mk_vault_admin";
const sessionLifetimeSeconds = 60 * 60 * 12;
const encoder = new TextEncoder();

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const value = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return atob(normalized);
}

async function sign(value: string, password: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function readCookie(request: Request, name: string): string | null {
  const entry = (request.headers.get("cookie")?.split(";") ?? []).find((cookie) => cookie.trim().startsWith(`${name}=`));
  return entry ? entry.trim().slice(name.length + 1) : null;
}

export async function authenticateOwner(password: string, env: Env): Promise<boolean> {
  if (!env.MK_VAULT_ADMIN_PASSWORD) return false;
  const [provided, expected] = await Promise.all([sign("password-check", password), sign("password-check", env.MK_VAULT_ADMIN_PASSWORD)]);
  return constantTimeEqual(provided, expected);
}

export async function createAdminSession(env: Env): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const payload = `${expiresAt}:owner`;
  return `${toBase64Url(encoder.encode(payload))}.${await sign(payload, env.MK_VAULT_ADMIN_PASSWORD)}`;
}

export async function hasAdminSession(request: Request, env: Env): Promise<boolean> {
  const session = readCookie(request, sessionName);
  if (!session || !env.MK_VAULT_ADMIN_PASSWORD) return false;
  const [encodedPayload, signature] = session.split(".");
  if (!encodedPayload || !signature) return false;
  try {
    const payload = fromBase64Url(encodedPayload);
    const [expiresAt, role] = payload.split(":");
    return role === "owner" && Number(expiresAt) >= Math.floor(Date.now() / 1000) && constantTimeEqual(signature, await sign(payload, env.MK_VAULT_ADMIN_PASSWORD));
  } catch {
    return false;
  }
}

export function sessionCookie(value: string): string {
  return `${sessionName}=${value}; Max-Age=${sessionLifetimeSeconds}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie(): string {
  return `${sessionName}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  return (await hasAdminSession(request, env)) ? null : json({ error: "Administrator sign-in is required." }, 401);
}

export async function writeProject(env: Env, project: ProjectRecord): Promise<void> {
  await env.VAULT_DB.prepare(
    `INSERT INTO projects (id, url, title, category, note, is_published, featured_rank, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       url = excluded.url, title = excluded.title, category = excluded.category, note = excluded.note,
       is_published = excluded.is_published, featured_rank = excluded.featured_rank, updated_at = excluded.updated_at`,
  ).bind(
    project.id, project.url, project.title, project.category, project.note,
    project.isPublished ? 1 : 0, project.featuredRank, project.createdAt, project.updatedAt,
  ).run();
}
