# Security Policy

## Supported configuration

MK Vault should be deployed with administrator authentication enabled and a private R2 bucket for remote backups. R2 credentials and database connection strings must remain in the deployment provider’s secret manager.

## Reporting a vulnerability

Please report security issues privately to the repository owner. Include a concise description, reproduction steps, impact, and any suggested mitigation. Do not publish exploit details before the issue has been reviewed and addressed.

## Security boundaries

The public catalog intentionally exposes only records the administrator has published. Archive management, publication, featured ordering, and remote backup procedures are administrator-restricted. The application is designed to store links and link metadata only; it does not accept project-file uploads.
