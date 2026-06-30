-- Run this in Supabase SQL Editor AFTER the schema.sql
-- Disables RLS and allows public access (fine for MVP, add auth later)

ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE answers DISABLE ROW LEVEL SECURITY;
