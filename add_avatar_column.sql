-- Add avatar_url field to users table
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

-- Add comment for the new column
COMMENT ON COLUMN users.avatar_url IS 'URL path to user avatar image';
