const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const sql = neon(process.env.DATABASE_URL);

function getUserById(userId) {
  return sql`SELECT username FROM users WHERE id = ${userId}`.then(res => res[0]);
}

function createUser(userId, username, startingChips = 1000 ) {
  return sql`INSERT INTO users (id, username, tokens) VALUES (${userId}, ${username}, ${startingChips}) RETURNING *`.then(res => res[0]);
}

function updateUserTokens(userId, newTokenAmount) {
  return sql`UPDATE users SET tokens = ${newTokenAmount} WHERE id = ${userId} RETURNING *`.then(res => res[0]);
} 

module.exports = {
  getUserById,
  createUser,
  updateUserTokens
};


const queries = {
  getUser: 'SELECT * FROM "User" WHERE user_id = $1;',
  createUser: 'INSERT INTO "User" (user_id, username, password, email, role, tokens) VALUES ($1, $2, \'\', \'\', \'user\', $3) ON CONFLICT (user_id) DO NOTHING;',
  getOrCreateUser: 'INSERT INTO "User" (user_id, username, password, email, role, tokens) VALUES ($1, $2, \'\', \'\', \'user\', $3) ON CONFLICT (user_id) DO NOTHING; SELECT * FROM "User" WHERE user_id = $1;',
  updateTokens: 'UPDATE "User" SET tokens = tokens + $2 WHERE user_id = $1;',
  setUserRole: 'UPDATE "User" SET role = $2 WHERE user_id = $1;',
  getUserStats: 'SELECT u.username, l.total_wins, l.total_games, u.tokens FROM "User" u LEFT JOIN "Leaderboard" l ON l.user_id = u.user_id WHERE u.user_id = $1;',

  getGame: 'SELECT * FROM "Game" WHERE name = $1;',
  getAllGames: 'SELECT * FROM "Game";',
  createGame: 'INSERT INTO "Game" (name, description, min_bet, max_bet) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING;',

  recordGameResult: 'INSERT INTO "GameResult" (user_id, game_id, result, bet_amount, win_amount) VALUES ($1, (SELECT game_id FROM "Game" WHERE name = $2), $3, $4, $5);',
  getUserGameHistory: 'SELECT gr.*, g.name AS game_name FROM "GameResult" gr JOIN "Game" g ON g.game_id = gr.game_id WHERE gr.user_id = $1 ORDER BY gr.timestamp DESC LIMIT $2;',
  getRecentGames: 'SELECT gr.*, u.username, g.name AS game_name FROM "GameResult" gr JOIN "User" u ON u.user_id = gr.user_id JOIN "Game" g ON g.game_id = gr.game_id ORDER BY gr.timestamp DESC LIMIT $1;',

  getLeaderboard: 'SELECT u.username, l.total_wins, l.total_games FROM "Leaderboard" l JOIN "User" u ON u.user_id = l.user_id ORDER BY total_wins DESC LIMIT $1;',
  getUserRank: 'SELECT COUNT(*) + 1 AS rank FROM "Leaderboard" WHERE total_wins > (SELECT total_wins FROM "Leaderboard" WHERE user_id = $1);',
  getLeaderboardEntry: 'SELECT * FROM "Leaderboard" WHERE user_id = $1;',

  getAllItems: 'SELECT * FROM "Item";',
  getItemsByType: 'SELECT * FROM "Item" WHERE item_type = $1;',
  getItem: 'SELECT * FROM "Item" WHERE item_id = $1;',
  createItem: 'INSERT INTO "Item" (name, description, cost_tokens, item_type, effect_data) VALUES ($1, $2, $3, $4, $5);',

  getUserInventory: 'SELECT i.item_id, it.name, it.description, inv.quantity FROM "Inventory" inv JOIN "Item" it ON it.item_id = inv.item_id WHERE inv.user_id = $1;',
  hasItem: 'SELECT quantity > 0 AS has_item FROM "Inventory" WHERE user_id = $1 AND item_id = $2;',
  addItemToInventory: 'INSERT INTO "Inventory" (user_id, item_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = "Inventory".quantity + EXCLUDED.quantity;',
  removeItemFromInventory: 'UPDATE "Inventory" SET quantity = quantity - $3 WHERE user_id = $1 AND item_id = $2 AND quantity >= $3;',
  equipItem: 'UPDATE "Inventory" SET is_equipped = TRUE WHERE user_id = $1 AND item_id = $2;',
  getEquippedItems: 'SELECT it.* FROM "Inventory" inv JOIN "Item" it ON it.item_id = inv.item_id WHERE inv.user_id = $1 AND inv.is_equipped = TRUE;',

  purchaseItem: 'WITH item_data AS (SELECT cost_tokens FROM "Item" WHERE item_id = $2) UPDATE "User" SET tokens = tokens - (SELECT cost_tokens FROM item_data) WHERE user_id = $1 AND tokens >= (SELECT cost_tokens FROM item_data); INSERT INTO "Inventory" (user_id, item_id, quantity) VALUES ($1, $2, 1) ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = "Inventory".quantity + 1;',

  createSession: 'INSERT INTO "GameSession" (channel_id, game_id, player_ids) VALUES ($1, (SELECT game_id FROM "Game" WHERE name = $2), $3);',
  endSession: 'UPDATE "GameSession" SET status = $2 WHERE session_id = $1;',
  getActiveSession: 'SELECT * FROM "GameSession" WHERE channel_id = $1 AND status = \'active\';',

  claimDailyReward: 'INSERT INTO "DailyReward" (user_id, last_claimed) VALUES ($1, CURRENT_DATE) ON CONFLICT (user_id) DO UPDATE SET last_claimed = CURRENT_DATE WHERE "DailyReward".last_claimed < CURRENT_DATE; UPDATE "User" SET tokens = tokens + 100 WHERE user_id = $1;',

  addTokensToUser: 'UPDATE "User" SET tokens = tokens + $2 WHERE user_id = $1; INSERT INTO "GameResult" (user_id, game_id, result, bet_amount, win_amount) VALUES ($1, NULL, \'admin_add_tokens\', 0, $2);',
  banUser: 'UPDATE "User" SET is_banned = TRUE WHERE user_id = $1;'
};

export default queries;
