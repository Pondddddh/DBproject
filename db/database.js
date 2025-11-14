const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: './.env' });

const sql = neon(process.env.DATABASE_URL);

// ============================================
// USER FUNCTIONS
// ============================================


async function getUserByEmail(email) {
  try {
    const result = await sql`
      SELECT * FROM "User" WHERE email = ${email}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('getUserByEmail error:', error);
    return null;
  }
}


async function getUserById(userId) {
  const result = await sql`SELECT * FROM "User" WHERE user_id = ${userId}`;
  return result[0] || null;
}

async function createUser(userId, username, startingChips = 1000) {
  const result = await sql`
    INSERT INTO "User" (user_id, username, tokens) 
    VALUES (${userId}, ${username}, ${startingChips}) 
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *
  `;
  return result[0] || null;
}

async function getOrCreateUser(userId, username, email, startingChips = 1000) {
  let user = await getUserById(userId);
  if (!user) {
    user = await createUser(userId, username, email, startingChips);
  }
  return user;
}

async function updateUserTokens(userId, newTokenAmount) {
  const result = await sql`
    UPDATE "User" 
    SET tokens = ${newTokenAmount} 
    WHERE user_id = ${userId} 
    RETURNING *
  `;
  return result[0] || null;
}

async function addTokensToUser(userId, amount) {
  const result = await sql`
    UPDATE "User" 
    SET tokens = tokens + ${amount} 
    WHERE user_id = ${userId} 
    RETURNING *
  `;
  return result[0] || null;
}

async function getUserStats(userId) {
  const result = await sql`
    SELECT u.username, u.tokens, 
           COALESCE(l.total_wins, 0) as total_wins, 
           COALESCE(l.total_games, 0) as total_games
    FROM "User" u 
    LEFT JOIN "Leaderboard" l ON l.user_id = u.user_id 
    WHERE u.user_id = ${userId}
  `;
  return result[0] || null;
}

async function setUserRole(userId, role) {
  const result = await sql`
    UPDATE "User" 
    SET role = ${role} 
    WHERE user_id = ${userId} 
    RETURNING *
  `;
  return result[0] || null;
}

async function banUser(userId) {
  const result = await sql`
    UPDATE "User" 
    SET is_banned = TRUE 
    WHERE user_id = ${userId} 
    RETURNING *
  `;
  return result[0] || null;
}

// ============================================
// GAME FUNCTIONS
// ============================================

async function getGame(gameName) {
  const result = await sql`SELECT * FROM "Game" WHERE name = ${gameName}`;
  return result[0] || null;
}

async function getAllGames() {
  return await sql`SELECT * FROM "Game"`;
}

async function createGame(name, description, minBet = 10, maxBet = 1000) {
  const result = await sql`
    INSERT INTO "Game" (name, description, min_bet, max_bet) 
    VALUES (${name}, ${description}, ${minBet}, ${maxBet}) 
    ON CONFLICT (name) DO NOTHING
    RETURNING *
  `;
  return result[0] || null;
}

// ============================================
// GAME RESULT FUNCTIONS
// ============================================

async function recordGameResult(userId, gameName, result, betAmount, winAmount) {
  const game = await getGame(gameName);
  if (!game) throw new Error(`Game "${gameName}" not found`);
  
  const gameResult = await sql`
    INSERT INTO "GameResult" (user_id, game_id, result, bet_amount, win_amount) 
    VALUES (${userId}, ${game.game_id}, ${result}, ${betAmount}, ${winAmount})
    RETURNING *
  `;
  
  // Update leaderboard if win
  if (result === 'win' || result === 'blackjack') {
    await updateLeaderboard(userId, true);
  } else if (result === 'lose') {
    await updateLeaderboard(userId, false);
  }
  
  return gameResult[0];
}

async function getUserGameHistory(userId, limit = 10) {
  return await sql`
    SELECT gr.*, g.name AS game_name 
    FROM "GameResult" gr 
    LEFT JOIN "Game" g ON g.game_id = gr.game_id 
    WHERE gr.user_id = ${userId} 
    ORDER BY gr.timestamp DESC 
    LIMIT ${limit}
  `;
}

async function getRecentGames(limit = 10) {
  return await sql`
    SELECT gr.*, u.username, g.name AS game_name 
    FROM "GameResult" gr 
    JOIN "User" u ON u.user_id = gr.user_id 
    LEFT JOIN "Game" g ON g.game_id = gr.game_id 
    ORDER BY gr.timestamp DESC 
    LIMIT ${limit}
  `;
}

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================

async function updateLeaderboard(userId, isWin) {
  const result = await sql`
    INSERT INTO "Leaderboard" (user_id, total_wins, total_games)
    VALUES (${userId}, ${isWin ? 1 : 0}, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_wins = "Leaderboard".total_wins + ${isWin ? 1 : 0},
      total_games = "Leaderboard".total_games + 1
    RETURNING *
  `;
  return result[0];
}

async function getLeaderboard(limit = 10) {
  return await sql`
    SELECT u.username, l.total_wins, l.total_games 
    FROM "Leaderboard" l 
    JOIN "User" u ON u.user_id = l.user_id 
    ORDER BY total_wins DESC 
    LIMIT ${limit}
  `;
}

async function getUserRank(userId) {
  const result = await sql`
    SELECT COUNT(*) + 1 AS rank 
    FROM "Leaderboard" 
    WHERE total_wins > (
      SELECT COALESCE(total_wins, 0) 
      FROM "Leaderboard" 
      WHERE user_id = ${userId}
    )
  `;
  return result[0]?.rank || null;
}

// ============================================
// ITEM & INVENTORY FUNCTIONS
// ============================================

async function getAllItems() {
  return await sql`SELECT * FROM "Item"`;
}

async function getItemsByType(itemType) {
  return await sql`SELECT * FROM "Item" WHERE item_type = ${itemType}`;
}

async function getItem(itemId) {
  const result = await sql`SELECT * FROM "Item" WHERE item_id = ${itemId}`;
  return result[0] || null;
}

async function createItem(name, description, costTokens, itemType, effectData = {}) {
  const result = await sql`
    INSERT INTO "Item" (name, description, cost_tokens, item_type, effect_data) 
    VALUES (${name}, ${description}, ${costTokens}, ${itemType}, ${JSON.stringify(effectData)})
    RETURNING *
  `;
  return result[0];
}

async function getUserInventory(userId) {
  return await sql`
    SELECT inv.inventory_id, inv.quantity, inv.is_equipped,
           it.item_id, it.name, it.description, it.cost_tokens, it.item_type, it.effect_data
    FROM "Inventory" inv 
    JOIN "Item" it ON it.item_id = inv.item_id 
    WHERE inv.user_id = ${userId}
  `;
}

async function hasItem(userId, itemId) {
  const result = await sql`
    SELECT quantity > 0 AS has_item 
    FROM "Inventory" 
    WHERE user_id = ${userId} AND item_id = ${itemId}
  `;
  return result[0]?.has_item || false;
}

async function addItemToInventory(userId, itemId, quantity = 1) {
  const result = await sql`
    INSERT INTO "Inventory" (user_id, item_id, quantity) 
    VALUES (${userId}, ${itemId}, ${quantity}) 
    ON CONFLICT (user_id, item_id) 
    DO UPDATE SET quantity = "Inventory".quantity + ${quantity}
    RETURNING *
  `;
  return result[0];
}

async function removeItemFromInventory(userId, itemId, quantity = 1) {
  const result = await sql`
    UPDATE "Inventory" 
    SET quantity = quantity - ${quantity} 
    WHERE user_id = ${userId} AND item_id = ${itemId} AND quantity >= ${quantity}
    RETURNING *
  `;
  return result[0] || null;
}

async function purchaseItem(userId, itemId) {
  const item = await getItem(itemId);
  if (!item) throw new Error('Item not found');
  
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.tokens < item.cost_tokens) throw new Error('Insufficient tokens');
  
  // Deduct tokens
  await sql`
    UPDATE "User" 
    SET tokens = tokens - ${item.cost_tokens} 
    WHERE user_id = ${userId}
  `;
  
  // Add item to inventory
  return await addItemToInventory(userId, itemId, 1);
}

async function equipItem(userId, itemId) {
  const result = await sql`
    UPDATE "Inventory" 
    SET is_equipped = TRUE 
    WHERE user_id = ${userId} AND item_id = ${itemId}
    RETURNING *
  `;
  return result[0] || null;
}

async function getEquippedItems(userId) {
  return await sql`
    SELECT it.* 
    FROM "Inventory" inv 
    JOIN "Item" it ON it.item_id = inv.item_id 
    WHERE inv.user_id = ${userId} AND inv.is_equipped = TRUE
  `;
}

// ============================================
// GAME SESSION FUNCTIONS
// ============================================

async function createSession(channelId, gameName, playerIds = []) {
  const game = await getGame(gameName);
  if (!game) throw new Error(`Game "${gameName}" not found`);
  
  const result = await sql`
    INSERT INTO "GameSession" (channel_id, game_id, player_ids) 
    VALUES (${channelId}, ${game.game_id}, ${playerIds})
    RETURNING *
  `;
  return result[0];
}

async function endSession(sessionId, status = 'completed') {
  const result = await sql`
    UPDATE "GameSession" 
    SET status = ${status} 
    WHERE session_id = ${sessionId}
    RETURNING *
  `;
  return result[0] || null;
}

async function getActiveSession(channelId) {
  const result = await sql`
    SELECT * FROM "GameSession" 
    WHERE channel_id = ${channelId} AND status = 'active'
  `;
  return result[0] || null;
}

// ============================================
// DAILY REWARD FUNCTIONS
// ============================================

async function claimDailyReward(userId, rewardAmount = 100) {
  // Check if already claimed today
  const existing = await sql`
    SELECT * FROM "DailyReward" 
    WHERE user_id = ${userId} AND last_claimed = CURRENT_DATE
  `;
  
  if (existing.length > 0) {
    return { success: false, message: 'Already claimed today' };
  }
  
  // Update or insert daily reward
  await sql`
    INSERT INTO "DailyReward" (user_id, last_claimed) 
    VALUES (${userId}, CURRENT_DATE) 
    ON CONFLICT (user_id) 
    DO UPDATE SET last_claimed = CURRENT_DATE
  `;
  
  // Add tokens
  await addTokensToUser(userId, rewardAmount);
  
  return { success: true, amount: rewardAmount };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // User functions
  getUserById,
  createUser,
  getOrCreateUser,
  updateUserTokens,
  addTokensToUser,
  getUserStats,
  setUserRole,
  banUser,
  getUserByEmail,
  
  // Game functions
  getGame,
  getAllGames,
  createGame,
  
  // Game result functions
  recordGameResult,
  getUserGameHistory,
  getRecentGames,
  
  // Leaderboard functions
  updateLeaderboard,
  getLeaderboard,
  getUserRank,
  
  // Item & Inventory functions
  getAllItems,
  getItemsByType,
  getItem,
  createItem,
  getUserInventory,
  hasItem,
  addItemToInventory,
  removeItemFromInventory,
  purchaseItem,
  equipItem,
  getEquippedItems,
  
  // Game session functions
  createSession,
  endSession,
  getActiveSession,
  
  // Daily reward functions
  claimDailyReward
};