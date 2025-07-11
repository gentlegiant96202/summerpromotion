-- Create the wheel_entries table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wheel_entries_date ON wheel_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_wheel_entries_mobile ON wheel_entries(mobile);
CREATE INDEX IF NOT EXISTS idx_wheel_entries_prize ON wheel_entries(prize_id);

-- Enable Row Level Security
ALTER TABLE wheel_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations" ON wheel_entries;
DROP POLICY IF EXISTS "Allow inserts for wheel entries" ON wheel_entries;
DROP POLICY IF EXISTS "Allow all inserts" ON wheel_entries;
DROP POLICY IF EXISTS "Allow all selects" ON wheel_entries;

-- Create policies for public access (for demo purposes)
-- Allow inserts from anyone
CREATE POLICY "Allow all inserts" ON wheel_entries
  FOR INSERT WITH CHECK (true);

-- Allow reads from anyone (for leaderboard)
CREATE POLICY "Allow all selects" ON wheel_entries
  FOR SELECT USING (true);

-- Enable real-time for the wheel_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE wheel_entries;

-- Insert some test data (optional - remove this in production)
INSERT INTO wheel_entries (name, mobile, selected_prize, prize_id, ip_address) VALUES
('Test User 1', '+971501234567', '1000 AED GIFT CARD SILBERARROWS', 2, '127.0.0.1'),
('Test User 2', '+971507654321', 'FULL CERAMIC COATING', 3, '127.0.0.1'),
('Test User 3', '+971509876543', '4 YEARS PREMIUM FREE SERVICECARE', 1, '127.0.0.1')
ON CONFLICT DO NOTHING; 