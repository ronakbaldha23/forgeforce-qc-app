# ForgeForce QC — Backend

Laravel 13 API for the ForgeForce QC app. See the [repository root README](../README.md)
for full setup instructions, architecture notes, and the database/audit-trail design.

Quick start:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan storage:link
php artisan serve
```
