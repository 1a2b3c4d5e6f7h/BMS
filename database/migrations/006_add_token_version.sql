ALTER TABLE users
ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
ADD CONSTRAINT chk_users_token_version
CHECK (token_version >= 0);