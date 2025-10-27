INSERT INTO users (
    user_id,
    username,
    email,
    password_hash,
    created_at
  )
VALUES (
    'user_id:uuid',
    'username:character varying',
    'email:character varying',
    'password_hash:character varying',
    'created_at:timestamp with time zone'
  );-- PostgreSQL Schema for a Community-Based Mental Health Web App

-- This script creates all the necessary tables, relationships, and indexes.



-- Note: It is recommended to run this script on a database named 'community'.

-- In psql, you can connect to it using the command: \c community



-- Enable UUID extension if not already enabled.

-- You need to run this command once per database.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



-- -----------------------------------------------------

-- Table: users

-- Stores user account information.

-- -----------------------------------------------------

CREATE TABLE users (

    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    username VARCHAR(50) NOT NULL UNIQUE,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



COMMENT ON TABLE users IS 'Stores user account information.';

COMMENT ON COLUMN users.user_id IS 'Unique identifier for each user.';

COMMENT ON COLUMN users.username IS 'Public-facing username, must be unique.';

COMMENT ON COLUMN users.password_hash IS 'Hashed password for security.';

COMMENT ON COLUMN users.created_at IS 'Timestamp of account creation.';





-- -----------------------------------------------------

-- Table: communities

-- Stores information about different communities or forums.

-- -----------------------------------------------------

CREATE TABLE communities (

    community_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL UNIQUE,

    slug VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    creator_id UUID NOT NULL REFERENCES users(user_id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



COMMENT ON TABLE communities IS 'Stores information about different communities.';

COMMENT ON COLUMN communities.slug IS 'URL-friendly version of the community name.';

COMMENT ON COLUMN communities.creator_id IS 'The user who created the community.';





-- -----------------------------------------------------

-- Table: community_members

-- Maps users to the communities they have joined (many-to-many relationship).

-- -----------------------------------------------------

CREATE TABLE community_members (

    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    community_id UUID NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, community_id) -- Composite key ensures a user joins a community only once.

);



COMMENT ON TABLE community_members IS 'Join table linking users and communities.';





-- -----------------------------------------------------

-- Table: posts

-- Stores posts submitted by users to communities.

-- -----------------------------------------------------

CREATE TABLE posts (

    post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    title VARCHAR(300) NOT NULL,

    content TEXT,

    author_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    community_id UUID NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,

    is_posted_anonymously BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



COMMENT ON TABLE posts IS 'Core content table for user posts.';

COMMENT ON COLUMN posts.author_id IS 'The user who created the post (never null, even if anonymous).';

COMMENT ON COLUMN posts.is_posted_anonymously IS 'Flag to hide author details in the application.';





-- -----------------------------------------------------

-- Table: comments

-- Stores replies to posts.

-- -----------------------------------------------------

CREATE TABLE comments (

    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    content TEXT NOT NULL,

    author_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    post_id UUID NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,

    parent_comment_id UUID REFERENCES comments(comment_id) ON DELETE CASCADE, -- For threaded replies

    is_posted_anonymously BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



COMMENT ON TABLE comments IS 'Stores replies to posts, allowing for nested conversations.';

COMMENT ON COLUMN comments.parent_comment_id IS 'If not NULL, this comment is a reply to another comment.';





-- -----------------------------------------------------

-- Table: votes

-- Tracks upvotes and downvotes on posts and comments.

-- -----------------------------------------------------

CREATE TABLE votes (

    vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    voter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,

    comment_id UUID REFERENCES comments(comment_id) ON DELETE CASCADE,

    vote_type SMALLINT NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for upvote, -1 for downvote

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A user can only vote once on any given post

    UNIQUE (voter_id, post_id),

    -- A user can only vote once on any given comment

    UNIQUE (voter_id, comment_id),

    -- Enforce that a vote must be for either a post or a comment, but not both or neither.

    CONSTRAINT chk_vote_target CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))

);



COMMENT ON TABLE votes IS 'Tracks user votes on posts and comments.';

COMMENT ON COLUMN votes.vote_type IS 'Represents the vote direction: 1 for upvote, -1 for downvote.';





-- -----------------------------------------------------

-- Indexes for PerformanceINSERT INTO users (
    user_id,
    username,
    email,
    password_hash,
    created_at,
    avatar_url
  )
VALUES (
    'user_id:uuid',
    'username:character varying',
    'email:character varying',
    'password_hash:character varying',
    'created_at:timestamp with time zone',
    'avatar_url:text'
  );

-- Adding indexes to foreign keys and other frequently queried columns.

-- -----------------------------------------------------

CREATE INDEX idx_posts_author_id ON posts(author_id);

CREATE INDEX idx_posts_community_id ON posts(community_id);

CREATE INDEX idx_comments_author_id ON comments(author_id);

CREATE INDEX idx_comments_post_id ON comments(post_id);

CREATE INDEX idx_votes_post_id ON votes(post_id);

CREATE INDEX idx_votes_comment_id ON votes(comment_id);

CREATE TABLE journal_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255), -- Title is optional
    content TEXT NOT NULL,
    mood VARCHAR(50), -- e.g., 'great', 'good', 'okay', 'bad', 'awful'
    ai_sentiment VARCHAR(50), -- To store AI analysis, e.g., 'positive', 'negative', 'neutral'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE journal_entries IS 'Stores private journal entries for each user.';
COMMENT ON COLUMN journal_entries.author_id IS 'Foreign key linking the entry to the user who wrote it.';
COMMENT ON COLUMN journal_entries.mood IS 'User-selected mood for the entry.';
COMMENT ON COLUMN journal_entries.ai_sentiment IS 'Sentiment analysis result from the AI model.';
COMMENT ON COLUMN journal_entries.created_at IS 'The date and time the entry was originally created.';


-- -----------------------------------------------------
-- Indexes for Performance
-- An index on author_id will make fetching a user's journal history very fast.
-- -----------------------------------------------------
CREATE INDEX idx_journal_entries_author_id ON journal_entries(author_id);

