-- Create the wheel_entries table
CREATE TABLE IF NOT EXISTS wheel_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  selected_prize VARCHAR(500) NOT NULL,
  prize_id INTEGER NOT NULL,
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on entry_date for better query performance
CREATE INDEX IF NOT EXISTS idx_wheel_entries_date ON wheel_entries(entry_date);

-- Create an index on mobile for potential duplicate checking
CREATE INDEX IF NOT EXISTS idx_wheel_entries_mobile ON wheel_entries(mobile);

-- Create an index on prize_id for analytics
CREATE INDEX IF NOT EXISTS idx_wheel_entries_prize ON wheel_entries(prize_id);

-- Optional: Create a view for analytics
CREATE OR REPLACE VIEW wheel_analytics AS
SELECT 
  prize_id,
  selected_prize,
  COUNT(*) as entry_count,
  DATE_TRUNC('day', entry_date) as entry_day
FROM wheel_entries 
GROUP BY prize_id, selected_prize, DATE_TRUNC('day', entry_date)
ORDER BY entry_day DESC, entry_count DESC;

-- Optional: Enable Row Level Security (RLS) for security
ALTER TABLE wheel_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows inserts but not reads (for security)
CREATE POLICY "Allow inserts for wheel entries" ON wheel_entries
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows reads only for authenticated users (optional)
-- CREATE POLICY "Allow reads for authenticated users" ON wheel_entries
--   FOR SELECT USING (auth.role() = 'authenticated');

-- Enable real-time for the wheel_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE wheel_entries; 