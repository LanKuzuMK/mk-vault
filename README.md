# MK Vault

> **A private ledger for public work.**

MK Vault is a link-only archive for websites, tools, games, portfolios, and experiments that are already live online. It keeps the pieces worth remembering in one considered place, with a private workspace for curation and a public collection for the work I choose to share.

[View the archive](https://mk-vault.pages.dev/) · [Open the private workspace](https://mk-vault.pages.dev/admin/)

## The idea

The archive treats every project as a record rather than a file upload. A record contains a destination URL, title, category, short note, publication status, and optional featured position. It stays intentionally lightweight: source files, builds, and hosted-site assets remain where they belong.

| Capability | What it does |
| --- | --- |
| **Private workspace** | Add, refine, publish, feature, or remove project links from a password-protected administrator area. |
| **Public collection** | Present selected projects in a responsive Royal Ledger interface without requiring visitors to sign in. |
| **Featured records** | Reserve positions 01–03 for the projects that should lead the collection. |
| **Link actions** | Open, copy, or share a project link directly from its record. |
| **Private continuity** | Save and restore a JSON archive of link metadata through a private R2 backup bucket. |

## Live architecture

The live archive runs on Cloudflare Pages and Functions. Project records are held in D1, backup archives remain in a private R2 bucket, and administrator actions require a signed, HTTP-only owner session. The public API exposes only visitor-safe project fields.

```text
Public collection  →  Pages + Functions  →  D1 project catalog
Private workspace  →  Signed owner session  →  D1 + private R2 backup archive
```

## Design language

MK Vault uses a **Royal Ledger** visual system: a dark ink base, restrained brass accents, archival typography, and deliberate interaction detail. The interface is written in a first-person voice so the archive reads as a personal body of work rather than a generic directory.

## Local development

The repository includes the full application source as well as the standalone Cloudflare deployment bundle.

```bash
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
```

For the Cloudflare bundle:

```bash
cd cloudflare
pnpm install
pnpm check
pnpm build
```

## Project structure

| Path | Purpose |
| --- | --- |
| `client/` | Main React interface and Royal Ledger design system. |
| `server/` | Local application API, catalog logic, and backup integration. |
| `drizzle/` | Relational schema and migrations for the local application stack. |
| `cloudflare/` | Cloudflare Pages frontend, Functions API, D1 schema, and deployment notes. |
| `docs/` | Project documentation. |

## Configuration and security

Keep every credential in the deployment provider’s secret manager. The live deployment requires D1 and R2 bindings plus the private `MK_VAULT_ADMIN_PASSWORD` secret. The password is never committed, returned by an API, or stored in browser storage.

R2 backups contain only archive metadata. They never include project source code, uploaded files, or hosted-site assets.

## Contributing and license

Contribution guidance is available in [CONTRIBUTING.md](CONTRIBUTING.md), while vulnerability reporting is described in [SECURITY.md](SECURITY.md). This project is released under the [MIT License](LICENSE).
