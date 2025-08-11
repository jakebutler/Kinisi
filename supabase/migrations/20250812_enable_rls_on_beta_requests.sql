-- Enable Row Level Security for beta_requests to restrict access (service role inserts via API)
ALTER TABLE beta_requests ENABLE ROW LEVEL SECURITY;

-- No permissive policies are added here to keep the table write-restricted.
-- The API route uses the Supabase service role key to insert server-side.
