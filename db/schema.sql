CREATE TABLE
  "User" (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    tokens INT DEFAULT 0
  );


CREATE TABLE
  "Game" (
    game_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
  );

CREATE TABLE
  "GameResult" (
    result_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    result VARCHAR(255) NOT NULL,
    bet_amount INT NOT NULL,
    win_amount INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_result_user FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_result_game FOREIGN KEY (game_id) REFERENCES "Game" (game_id) ON DELETE CASCADE
  );

CREATE TABLE
  "Leaderboard" (
    leader_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    total_wins INT DEFAULT 0,
    total_games INT DEFAULT 0,
    CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE
  );

CREATE TABLE
  "Item" (
    item_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cost_tokens INT NOT NULL
  );

CREATE TABLE
  "Inventory" (
    inventory_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    CONSTRAINT fk_inventory_user FOREIGN KEY (user_id) REFERENCES "User" (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_item FOREIGN KEY (item_id) REFERENCES "Item" (item_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_item UNIQUE (user_id, item_id)
  );