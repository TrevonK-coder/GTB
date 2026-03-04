-- GTB Collective — Supabase Database Setup
-- Run this in the Supabase SQL Editor (supabase.com → project → SQL Editor)

-- ═══════════════════════════════════════════════════
-- 1. MEMBERS TABLE
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS members (
  id           TEXT PRIMARY KEY,
  display_name TEXT,
  emoji        TEXT,
  tags         TEXT,
  bio          TEXT,
  instagram    TEXT DEFAULT '',
  tiktok       TEXT DEFAULT '',
  youtube      TEXT DEFAULT '',
  github       TEXT DEFAULT '',
  cv           TEXT DEFAULT '',
  user_id      UUID REFERENCES auth.users(id),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Members can read their own row
CREATE POLICY "Members read own" ON members
  FOR SELECT USING (auth.uid() = user_id);

-- Members can update their own row
CREATE POLICY "Members update own" ON members
  FOR UPDATE USING (auth.uid() = user_id);

-- Anyone can read (for the public site)
CREATE POLICY "Public read members" ON members
  FOR SELECT USING (true);

-- Allow inserts (for initial seed)
CREATE POLICY "Allow inserts" ON members
  FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════
-- 2. PENDING CHANGES TABLE
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pending_changes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id     TEXT REFERENCES members(id),
  member_title  TEXT,
  current_data  JSONB,
  proposed      JSONB,
  prompt_text   TEXT,
  status        TEXT DEFAULT 'pending',
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pending_changes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert
CREATE POLICY "Auth users can insert" ON pending_changes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Anyone can read (admin needs to see all)
CREATE POLICY "Public read changes" ON pending_changes
  FOR SELECT USING (true);

-- Anyone authenticated can update (for admin approve/reject)
CREATE POLICY "Auth users can update" ON pending_changes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════
-- 3. SEED MEMBER DATA
-- ═══════════════════════════════════════════════════
INSERT INTO members (id, display_name, emoji, tags, bio, instagram, tiktok, youtube)
VALUES
  ('polymath',     'The Polymath',     '🎙️', 'Artist · Journalist · Producer',      'Narrates the GTB story with rhythmic precision and journalistic integrity.', '', '', ''),
  ('performer',    'The Performer',    '🎭', 'Actor · Front-End Developer',          'Bridges human charisma with technical logic.', '', '', ''),
  ('visionary',    'The Visionary',    '🎬', 'Videographer · Visual Tech Dev',       'Cinematic aesthetics meet high-performance code.', '', '', ''),
  ('specialist',   'The Specialist',   '💊', 'Doctor · Gym Enthusiast',              'Medical accuracy meets elite physical output.', '', '', ''),
  ('gastronomist', 'The Gastronomist', '🍽️', 'Chef · Performance Nutrition',        'Culinary arts for high-performance living.', 'https://www.instagram.com/chef.kenah/', 'https://www.tiktok.com/@chef_kenah', ''),
  ('architect',    'The Architect',    '🏗️', 'Lead Dev · Backend · APIs · Security', 'The GTB foundation. Heavy-duty backend, API bridges, system security.', '', '', ''),
  ('artist',       'The Artist',       '🎵', 'Music · Creative Direction',           'The sonic pulse of GTB. Experimental soundscapes and creative purity.', 'https://www.instagram.com/gtbemzee/', 'https://www.tiktok.com/@gtbemzee', 'https://www.youtube.com/@gtbemzee'),
  ('engineer',     'The Engineer',     '⚙️', 'Full-Stack · Deployment · Scaling',   'Rapid deployment and scaling. The glue for all GTB digital properties.', '', '', '')
ON CONFLICT (id) DO NOTHING;
