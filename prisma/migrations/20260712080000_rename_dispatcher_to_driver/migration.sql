-- Rename the DISPATCHER role to DRIVER.
-- Uses ALTER TYPE ... RENAME VALUE so existing rows (roles/users) are preserved
-- rather than dropped and recreated.
ALTER TYPE "RoleKey" RENAME VALUE 'DISPATCHER' TO 'DRIVER';
