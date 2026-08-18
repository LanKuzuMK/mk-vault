# Cloudflare deployment

This folder is a standalone Cloudflare Pages build for MK Vault. It preserves the public project collection, a password-protected owner administration area, D1 project records, and R2 JSON backups. It is intentionally self-contained for the live deployment.

## Required dashboard setup

Create a D1 database named `mk-vault`, apply `migrations/0001_projects.sql`, and bind it as `VAULT_DB`. Bind the existing private `mk-vault-backups` bucket as `VAULT_BACKUPS`. Set `MK_VAULT_ADMIN_PASSWORD` as a Pages secret. The `/admin/` interface obtains a signed, secure, twelve-hour, HTTP-only owner session only after that password is supplied; every management and backup Function verifies that session before operating.

Set the Pages build root to `cloudflare`, the build command to `pnpm install --frozen-lockfile && pnpm build`, and the output directory to `dist`. The dedicated `admin/index.html` entry gives `/admin/` its own SPA document, while the API remains served by its dedicated Pages Functions.
