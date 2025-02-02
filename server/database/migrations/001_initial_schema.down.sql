-- Drop tables in reverse order to respect foreign key constraints
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS linked_accounts;
DROP TABLE IF EXISTS users;