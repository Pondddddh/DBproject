DROP TABLE IF EXISTS "DailyReward" CASCADE;
DROP TABLE IF EXISTS "GameSession" CASCADE;
DROP TABLE IF EXISTS "Inventory" CASCADE;
DROP TABLE IF EXISTS "Item" CASCADE;
DROP TABLE IF EXISTS "Leaderboard" CASCADE;
DROP TABLE IF EXISTS "GameResult" CASCADE;
DROP TABLE IF EXISTS "Game" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE TABLE "User" (
  user_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  role VARCHAR(50) DEFAULT 'user',
  tokens INT DEFAULT 1000,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Game" (
  game_id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  min_bet INT DEFAULT 10,
  max_bet INT DEFAULT 1000
);

CREATE TABLE "GameResult" (
  result_id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  game_id INT, 
  result VARCHAR(255) NOT NULL,
  bet_amount INT NOT NULL DEFAULT 0,
  win_amount INT NOT NULL DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_game_result_user FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_game_result_game FOREIGN KEY (game_id) REFERENCES "Game" (game_id) ON DELETE CASCADE
);

CREATE TABLE "Leaderboard" (
  leader_id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  total_wins INT DEFAULT 0,
  total_games INT DEFAULT 0,
  CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE
);

CREATE TABLE "Item" (
  item_id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  cost_tokens INT NOT NULL,
  item_type VARCHAR(100),
  effect_data JSONB
);

CREATE TABLE "Inventory" (
  inventory_id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  is_equipped BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_inventory_user FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_item FOREIGN KEY (item_id) REFERENCES "Item" (item_id) ON DELETE CASCADE,
  CONSTRAINT unique_user_item UNIQUE (user_id, item_id)
);

CREATE TABLE "GameSession" (
  session_id SERIAL PRIMARY KEY,
  channel_id VARCHAR(255) NOT NULL,
  game_id INT NOT NULL,
  player_ids TEXT[], 
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_game FOREIGN KEY (game_id) REFERENCES "Game" (game_id) ON DELETE CASCADE
);

CREATE TABLE "DailyReward" (
  reward_id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  last_claimed DATE,
  streak INT DEFAULT 0,
  CONSTRAINT fk_daily_reward_user FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_username ON "User" (username);
CREATE INDEX idx_game_result_user ON "GameResult" (user_id);
CREATE INDEX idx_game_result_timestamp ON "GameResult" (timestamp DESC);
CREATE INDEX idx_leaderboard_wins ON "Leaderboard" (total_wins DESC);
CREATE INDEX idx_inventory_user ON "Inventory" (user_id);
CREATE INDEX idx_session_channel ON "GameSession" (channel_id, status);