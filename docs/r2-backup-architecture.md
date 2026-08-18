# MK Vault Remote Backup Architecture

## Storage boundary

MK Vault retains its working archive in browser `localStorage`. Remote storage is an optional, explicit backup action available only to an authenticated user. The Cloudflare R2 bucket is named `mk-vault-backups`; it was created without a public delivery configuration and is accessed only through server-side S3-compatible requests.

## Per-user object layout

| Purpose | Private R2 key |
| --- | --- |
| Latest restorable archive | `vaults/<authenticated-user-id>/latest.json` |
| Historical snapshot | `vaults/<authenticated-user-id>/history/<UTC-timestamp>.json` |

Every authenticated procedure derives `<authenticated-user-id>` from the server session. The client cannot submit or select another user’s prefix. A backup writes both the latest record and a timestamped history record; restoring reads only the current user’s latest record.

## Credential handling

The R2 endpoint, access key ID, secret access key, and bucket name are available only as server environment variables. The React application calls authenticated procedures and never receives the R2 secret or an object-storage URL. The supplied token was verified with read, write, and immediate-delete requests against the new bucket.

## Data and operation notes

Remote backups contain project URLs, titles, categories, notes, creation timestamps, and record IDs. Backups are not automatic: users deliberately choose **Backup to R2**. The timestamped history objects are retained until the bucket lifecycle is changed or objects are removed; no automatic retention policy has been configured.
