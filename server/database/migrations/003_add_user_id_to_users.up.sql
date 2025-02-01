ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) UNIQUE;

-- Backfill existing users with a UUID as user_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM users WHERE user_id IS NULL
    LOOP
        UPDATE users
        SET user_id = gen_random_uuid()::text
        WHERE id = r.id;
    END LOOP;
END $$;

-- Make user_id NOT NULL after backfill
ALTER TABLE users ALTER COLUMN user_id SET NOT NULL;