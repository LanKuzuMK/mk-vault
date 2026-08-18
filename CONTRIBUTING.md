# Contributing to MK Vault

Thank you for contributing. MK Vault is a link-only archive, so proposed features should preserve the distinction between link metadata and hosted project files.

## Development workflow

Create a focused branch, keep changes small, and write clear commit messages. Before requesting review, run the following commands from the repository root:

```bash
pnpm test
pnpm check
pnpm build
```

## Engineering expectations

Use the existing React, TypeScript, tRPC, and Drizzle conventions. Keep server credentials and storage access server-side. Public operations must not expose administrator controls, private R2 object keys, or secret values.

When changing database schema, generate a Drizzle migration, review the SQL, and apply the migration through the approved deployment workflow. Add or update Vitest coverage for server-side behavior and verify responsive UI changes before requesting review.

## Pull requests

Describe the user-facing change, the validation performed, and any configuration or migration steps. Do not include `.env` files, API keys, R2 credentials, private export JSON, or hosted project files in commits.

## Code of conduct

Be respectful, constructive, and specific. Focus discussion on the behavior of the software and its users.
