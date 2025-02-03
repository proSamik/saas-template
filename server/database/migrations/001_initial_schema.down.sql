-- Drop tables in reverse order of creation to handle dependencies
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS linked_accounts;
DROP TABLE IF EXISTS token_blacklist;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;