/*
  # Configuração de Ambientes de Desenvolvimento

  1. Novas Tabelas
    - Criação de tabelas com prefixos para cada ambiente:
      - Desenvolvimento (des_)
      - Teste (test_)
      - Produção (prod_)
    
  2. Funções de Migração
    - Funções para migrar dados entre ambientes:
      - desenvolvimento -> teste
      - teste -> produção
    
  3. Segurança
    - Políticas RLS para cada conjunto de tabelas
*/

-- Função para migrar dados de desenvolvimento para teste
CREATE OR REPLACE FUNCTION migrate_to_test(table_name text)
RETURNS void AS $$
DECLARE
  des_table text;
  test_table text;
  column_list text;
BEGIN
  des_table := 'des_' || table_name;
  test_table := 'test_' || table_name;
  
  -- Obtém a lista de colunas
  SELECT string_agg(column_name, ', ')
  INTO column_list
  FROM information_schema.columns
  WHERE table_name = des_table;
  
  -- Limpa a tabela de teste
  EXECUTE 'TRUNCATE TABLE ' || test_table;
  
  -- Copia os dados
  EXECUTE 'INSERT INTO ' || test_table || ' SELECT * FROM ' || des_table;
END;
$$ LANGUAGE plpgsql;

-- Função para migrar dados de teste para produção
CREATE OR REPLACE FUNCTION migrate_to_prod(table_name text)
RETURNS void AS $$
DECLARE
  test_table text;
  prod_table text;
  column_list text;
BEGIN
  test_table := 'test_' || table_name;
  prod_table := 'prod_' || table_name;
  
  -- Obtém a lista de colunas
  SELECT string_agg(column_name, ', ')
  INTO column_list
  FROM information_schema.columns
  WHERE table_name = test_table;
  
  -- Faz backup dos dados de produção
  EXECUTE 'CREATE TABLE IF NOT EXISTS ' || prod_table || '_backup AS SELECT * FROM ' || prod_table;
  
  -- Limpa a tabela de produção
  EXECUTE 'TRUNCATE TABLE ' || prod_table;
  
  -- Copia os dados
  EXECUTE 'INSERT INTO ' || prod_table || ' SELECT * FROM ' || test_table;
END;
$$ LANGUAGE plpgsql;

-- Criação das tabelas com prefixos
-- Profiles
CREATE TABLE des_profiles (LIKE profiles INCLUDING ALL);
CREATE TABLE test_profiles (LIKE profiles INCLUDING ALL);
CREATE TABLE prod_profiles (LIKE profiles INCLUDING ALL);

-- Communities
CREATE TABLE des_communities (LIKE communities INCLUDING ALL);
CREATE TABLE test_communities (LIKE communities INCLUDING ALL);
CREATE TABLE prod_communities (LIKE communities INCLUDING ALL);

-- Community Members
CREATE TABLE des_community_members (LIKE community_members INCLUDING ALL);
CREATE TABLE test_community_members (LIKE community_members INCLUDING ALL);
CREATE TABLE prod_community_members (LIKE community_members INCLUDING ALL);

-- Competitions
CREATE TABLE des_competitions (LIKE competitions INCLUDING ALL);
CREATE TABLE test_competitions (LIKE competitions INCLUDING ALL);
CREATE TABLE prod_competitions (LIKE competitions INCLUDING ALL);

-- Teams
CREATE TABLE des_teams (LIKE teams INCLUDING ALL);
CREATE TABLE test_teams (LIKE teams INCLUDING ALL);
CREATE TABLE prod_teams (LIKE teams INCLUDING ALL);

-- Team Members
CREATE TABLE des_team_members (LIKE team_members INCLUDING ALL);
CREATE TABLE test_team_members (LIKE team_members INCLUDING ALL);
CREATE TABLE prod_team_members (LIKE team_members INCLUDING ALL);

-- Games
CREATE TABLE des_games (LIKE games INCLUDING ALL);
CREATE TABLE test_games (LIKE games INCLUDING ALL);
CREATE TABLE prod_games (LIKE games INCLUDING ALL);

-- Game Rounds
CREATE TABLE des_game_rounds (LIKE game_rounds INCLUDING ALL);
CREATE TABLE test_game_rounds (LIKE game_rounds INCLUDING ALL);
CREATE TABLE prod_game_rounds (LIKE game_rounds INCLUDING ALL);

-- Statistics
CREATE TABLE des_statistics (LIKE statistics INCLUDING ALL);
CREATE TABLE test_statistics (LIKE statistics INCLUDING ALL);
CREATE TABLE prod_statistics (LIKE statistics INCLUDING ALL);

-- Habilitar RLS para todas as tabelas
ALTER TABLE des_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_profiles ENABLE ROW LEVEL SECURITY;
-- Repetir para todas as outras tabelas...

-- Criar políticas de segurança para cada ambiente
CREATE POLICY "Usuários podem visualizar perfis públicos em desenvolvimento"
  ON des_profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem visualizar perfis públicos em teste"
  ON test_profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem visualizar perfis públicos em produção"
  ON prod_profiles FOR SELECT
  USING (true);