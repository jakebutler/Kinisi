-- Migration: Create beta_requests table for unauthenticated homepage beta access form

-- 1. Create beta_requests table
CREATE TABLE IF NOT EXISTS beta_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    referral_source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Constraints
ALTER TABLE beta_requests
    ADD CONSTRAINT beta_requests_email_unique UNIQUE (email);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_beta_requests_created_at ON beta_requests(created_at);
