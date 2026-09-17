-- Jalankan di Supabase Dashboard > SQL Editor
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  origin TEXT,
  qr_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'Hadir'
);
ALTER PUBLICATION supabase_realtime ADD TABLE attendances;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Allow anon (publishable key) to read/write - untuk demo tanpa auth
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all participants" ON participants;
CREATE POLICY "allow all participants" ON participants FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow all attendances" ON attendances;
CREATE POLICY "allow all attendances" ON attendances FOR ALL USING (true) WITH CHECK (true);
