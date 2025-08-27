-- Website Monitoring App - Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create the websites table
CREATE TABLE IF NOT EXISTS websites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'checking',
  uptime INTEGER NOT NULL DEFAULT 0,
  downtime INTEGER NOT NULL DEFAULT 0,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uptime_percentage REAL DEFAULT 100,
  last_error TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_created_at ON websites(created_at);
CREATE INDEX IF NOT EXISTS idx_websites_last_checked ON websites(last_checked);

-- Enable Row Level Security (RLS)
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is a demo app)
-- In production, you would want more restrictive policies
CREATE POLICY "Allow all operations on websites" ON websites
  FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample data for testing
INSERT INTO websites (name, url, status) VALUES 
  ('Google', 'https://google.com', 'online'),
  ('GitHub', 'https://github.com', 'online'),
  ('Example Site', 'https://example.com', 'checking')
ON CONFLICT (id) DO NOTHING;