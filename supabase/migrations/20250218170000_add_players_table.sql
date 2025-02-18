-- Create players table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'players') THEN
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
END IF;
END $$;

-- Create environment-specific tables
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'des_players') THEN
  CREATE TABLE des_players (LIKE players INCLUDING ALL);
END IF;
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_players') THEN
  CREATE TABLE test_players (LIKE players INCLUDING ALL);
END IF;
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prod_players') THEN
  CREATE TABLE prod_players (LIKE players INCLUDING ALL);
END IF;
END $$;

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE des_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_players ENABLE ROW LEVEL SECURITY;

-- Create policies for the main players table
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Public players are viewable by everyone') THEN
  CREATE POLICY "Public players are viewable by everyone"
    ON players FOR SELECT
    USING (true);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Users can insert their own player record') THEN
  CREATE POLICY "Users can insert their own player record"
    ON players FOR INSERT
    WITH CHECK (auth.uid() = id);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Users can update their own player record') THEN
  CREATE POLICY "Users can update their own player record"
    ON players FOR UPDATE
    USING (auth.uid() = id);
END IF;
END $$;

-- Create policies for development environment
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'des_players' AND policyname = 'Users can view their own players in development') THEN
  CREATE POLICY "Users can view their own players in development"
    ON des_players FOR SELECT
    USING (true);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'des_players' AND policyname = 'Users can insert players in development') THEN
  CREATE POLICY "Users can insert players in development"
    ON des_players FOR INSERT
    WITH CHECK (true);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'des_players' AND policyname = 'Users can update players in development') THEN
  CREATE POLICY "Users can update players in development"
    ON des_players FOR UPDATE
    USING (true);
END IF;
END $$;

-- Create policies for test environment
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_players' AND policyname = 'Public players are viewable by everyone in test') THEN
  CREATE POLICY "Public players are viewable by everyone in test"
    ON test_players FOR SELECT
    USING (true);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_players' AND policyname = 'Users can insert players in test') THEN
  CREATE POLICY "Users can insert players in test"
    ON test_players FOR INSERT
    WITH CHECK (true);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_players' AND policyname = 'Users can update players in test') THEN
  CREATE POLICY "Users can update players in test"
    ON test_players FOR UPDATE
    USING (true);
END IF;
END $$;

-- Create policies for production environment
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prod_players' AND policyname = 'Public players are viewable by everyone in production') THEN
  CREATE POLICY "Public players are viewable by everyone in production"
    ON prod_players FOR SELECT
    USING (true);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prod_players' AND policyname = 'Users can insert their own player record in production') THEN
  CREATE POLICY "Users can insert their own player record in production"
    ON prod_players FOR INSERT
    WITH CHECK (auth.uid() = id);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prod_players' AND policyname = 'Users can update their own player record in production') THEN
  CREATE POLICY "Users can update their own player record in production"
    ON prod_players FOR UPDATE
    USING (auth.uid() = id);
END IF;
END $$;