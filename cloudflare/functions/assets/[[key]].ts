import type { Env } from "../api/_shared";

const assets = new Map([
  ["mk-vault-seal.png", "image/png"],
  ["mk-vault-masthead.jpg", "image/jpeg"],
  ["mk-vault-fallback-tile.jpg", "image/jpeg"],
  ["mk-vault-archive-tile.jpg", "image/jpeg"],
]);

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const key = Array.isArray(params.key) ? params.key.join("/") : String(params.key ?? "");
  const contentType = assets.get(key);
  if (!contentType) return new Response("Not found", { status: 404 });

  const object = await env.VAULT_BACKUPS.get(`assets/${key}`);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? contentType,
      "cache-control": "public, max-age=31536000, immutable",
      etag: object.httpEtag,
    },
  });
};
