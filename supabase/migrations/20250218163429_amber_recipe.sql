/*
  # Esquema Inicial para DominoApp

  1. Tabelas
    - users (gerenciado pelo Supabase Auth)
    - profiles
      - Informações estendidas do usuário
      - Vinculado ao auth.users
    - communities
      - Gerenciamento de grupos
      - Configurações de privacidade
    - community_members
      - Membros da comunidade e funções
    - competitions
      - Gerenciamento de torneios/ligas
    - teams
      - Gerenciamento de times
    - team_members
      - Membros dos times
    - games
      - Registros individuais de jogos
    - game_rounds
      - Pontuação rodada a rodada
    - statistics
      - Estatísticas de jogadores e times

  2. Segurança
    - Políticas RLS para todas as tabelas
    - Controle de acesso baseado em função

  Sequência de Execução:
  1. Criar tipos personalizados
  2. Criar tabela de perfis
  3. Criar tabela de comunidades
  4. Criar tabela de membros da comunidade
  5. Criar tabela de competições
  6. Criar tabela de times
  7. Criar tabela de membros do time
  8. Criar tabela de jogos
  9. Criar tabela de rodadas
  10. Criar tabela de estatísticas
  11. Habilitar RLS
  12. Criar políticas de segurança
  13. Criar funções e gatilhos
*/

-- Create custom types
DO $$ BEGIN
  CREATE TYPE community_privacy AS ENUM ('public', 'private');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('admin', 'member');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE game_status AS ENUM ('pending', 'in_progress', 'finished');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE victory_type AS ENUM ('simple', 'carroca', 'la_e_lo', 'cruzada', 'count_based', 'tie');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  full_name text,
  phone_number text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

END IF;
END $$;

-- Create communities table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'communities') THEN
CREATE TABLE communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  privacy community_privacy DEFAULT 'public',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

END IF;
END $$;

-- Create community_members table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_members') THEN
CREATE TABLE community_members (
  community_id uuid REFERENCES communities(id),
  user_id uuid REFERENCES profiles(id),
  role member_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

END IF;
END $$;

-- Create competitions table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'competitions') THEN
CREATE TABLE competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id),
  name text NOT NULL,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

END IF;
END $$;

-- Create teams table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teams') THEN
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  community_id uuid REFERENCES communities(id),
  created_at timestamptz DEFAULT now()
);

END IF;
END $$;

-- Create team_members table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_members') THEN
CREATE TABLE team_members (
  team_id uuid REFERENCES teams(id),
  user_id uuid REFERENCES profiles(id),
  PRIMARY KEY (team_id, user_id)
);

END IF;
END $$;

-- Create games table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'games') THEN
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES competitions(id),
  team1_id uuid REFERENCES teams(id),
  team2_id uuid REFERENCES teams(id),
  status game_status DEFAULT 'pending',
  winner_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

END IF;
END $$;

-- Create game_rounds table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_rounds') THEN
CREATE TABLE game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id),
  round_number integer NOT NULL,
  team1_score integer DEFAULT 0,
  team2_score integer DEFAULT 0,
  victory_type victory_type,
  buchuda boolean DEFAULT false,
  buchuda_re boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

END IF;
END $$;

-- Create statistics table
DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'statistics') THEN
CREATE TABLE statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  community_id uuid REFERENCES communities(id),
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  total_points integer DEFAULT 0,
  buchudas integer DEFAULT 0,
  buchudas_re integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

END IF;
END $$;

-- Enable RLS
DO $$ BEGIN
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public communities are viewable by everyone"
  ON communities FOR SELECT
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM community_members WHERE community_id = id AND player_id IN (
      SELECT id FROM players WHERE created_by = auth.uid()
    )
  ));

CREATE POLICY "Community members can view private communities"
  ON communities FOR SELECT
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM community_members WHERE community_id = id AND player_id IN (
      SELECT id FROM players WHERE created_by = auth.uid()
    )
  ));

CREATE POLICY "Community admins can update community"
  ON communities FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_id = id AND player_id IN (
      SELECT id FROM players WHERE created_by = auth.uid()
    ) AND role = 'admin'
  ));

CREATE POLICY "Users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Add more policies as needed for other tables

-- Create functions
CREATE OR REPLACE FUNCTION update_statistics() 
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  competition_community_id uuid;
BEGIN
  -- Get the community_id from the competition
  SELECT community_id INTO competition_community_id
  FROM competitions
  WHERE id = NEW.competition_id;

  -- Update statistics when a game is finished
  IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
    -- Create or update winner statistics
    INSERT INTO statistics (user_id, community_id, games_played, games_won, updated_at)
    SELECT 
      tm.user_id,
      competition_community_id,
      1,
      1,
      now()
    FROM team_members tm
    WHERE tm.team_id = NEW.winner_id
    ON CONFLICT (user_id, community_id) DO UPDATE
    SET 
      games_played = statistics.games_played + 1,
      games_won = statistics.games_won + 1,
      updated_at = now();
    
    -- Create or update loser statistics
    INSERT INTO statistics (user_id, community_id, games_played, updated_at)
    SELECT 
      tm.user_id,
      competition_community_id,
      1,
      now()
    FROM team_members tm
    WHERE tm.team_id IN (NEW.team1_id, NEW.team2_id)
    AND tm.team_id != NEW.winner_id
    ON CONFLICT (user_id, community_id) DO UPDATE
    SET 
      games_played = statistics.games_played + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_game_statistics ON games;
  CREATE TRIGGER update_game_statistics
    AFTER UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_statistics();
EXCEPTION 
  WHEN duplicate_object THEN null;
END $$;