# Cloudflare deployment record

The Cloudflare Pages project is named `mk-vault` and is published at `https://mk-vault.pages.dev`. Its first production deployment is `https://a85c615a.mk-vault.pages.dev`.

The deployment uses the Cloudflare account `600125d358de768307cf0dba7d5040fd`. The D1 database `mk-vault` has ID `5392f5cf-644a-4d00-bfab-83e875d0e183`, has the project schema applied, and is bound to the Pages Functions as `VAULT_DB`. The existing private R2 bucket `mk-vault-backups` is bound as `VAULT_BACKUPS`. The public collection loaded successfully at the production URL after the first deployment.

The canonical administrator URL is `https://mk-vault.pages.dev/admin/`. It is a dedicated static entry that preserves the administrator URL and presents an owner-password sign-in screen. The private `MK_VAULT_ADMIN_PASSWORD` Pages secret creates a signed, secure, twelve-hour, HTTP-only session. Management and R2 backup Functions deny anonymous requests and require that session. Zero Trust was not activated, so no card-authorization checkout was accepted.
