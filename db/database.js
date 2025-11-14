const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const sql = neon(process.env.DATABASE_URL);

class Database {

  async getUser(userId) {
    const result = await sql`
      SELECT * FROM user WHERE user_id = ${userId}
    `;
    return result[0] || null;
  }

  async getUserByUsername(username) {
    const result = await sql`
      SELECT * FROM user WHERE username = ${username}
    `;
    return result[0] || null;
  }


async createUser(username, password, email, role = 'player', startingTokens = 1000) {
  const result = await sql`
    INSERT INTO users (username, password, email, role, tokens)
    VALUES (${username}, ${password}, ${email}, ${role}, ${startingTokens})
    RETURNING *
  `;
  return result[0];
}



async resetPassword(userId, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  await sql`
    UPDATE user
    SET password = ${hashedPassword},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  
  return { success: true, message: 'Password reset successfully' };
}

async updatePassword(userId, oldPassword, newPassword) {
  const user = await this.getUser(userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    return { success: false, message: 'Incorrect current password' };
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  await sql`
    UPDATE user
    SET password = ${hashedPassword},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  
  return { success: true, message: 'Password updated successfully' };
}


  async updateUser(userId, updates) {
    const { username, role, tokens } = updates;
    const result = await sql`
      UPDATE user 
      SET username = COALESCE(${username}, username),
          role = COALESCE(${role}, role),
          tokens = COALESCE(${tokens}, tokens),
          updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return result[0];
  }

  async updateTokens(userId, amount) {
    const result = await sql`
      UPDATE user 
      SET tokens = tokens + ${amount},
          updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return result[0];
  }

  async setUserRole(userId, role) {
    await sql`
      UPDATE user
      SET role = ${role},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  }

  async deleteUser(userId) {
    await sql`
      DELETE FROM user WHERE user_id = ${userId}
    `;
  }

  async getAllUsers(limit = 100) {
    return await sql`
      SELECT user_id, username, role, tokens, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  }

  async getUserStats(userId) {
    const result = await sql`
      SELECT * FROM user_stats WHERE user_id = ${userId}
    `;
    return result[0] || null;
  }

async authenticateUser(username, password) {
  const user = await this.getUserByUsername(username);
  if (!user) return null;
  
  const match = await bcrypt.compare(password, user.password);
  
  if (match) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
}

  async getGame(gameId) {
    const result = await sql`
      SELECT * FROM game WHERE game_id = ${gameId}
    `;
    return result[0] || null;
  }

  async getGameByName(gameName) {
    const result = await sql`
      SELECT * FROM game WHERE name = ${gameName}
    `;
    return result[0] || null;
  }

  async getAllGames() {
    return await sql`
      SELECT * FROM game ORDER BY name
    `;
  }

  async createGame(name, description) {
    const result = await sql`
      INSERT INTO game (name, description)
      VALUES (${name}, ${description})
      RETURNING *
    `;
    return result[0];
  }

  async updateGame(gameId, updates) {
    const { name, description } = updates;
    const result = await sql`
      UPDATE game
      SET name = COALESCE(${name}, name),
          description = COALESCE(${description}, description)
      WHERE game_id = ${gameId}
      RETURNING *
    `;
    return result[0];
  }

  async deleteGame(gameId) {
    await sql`
      DELETE FROM game WHERE game_id = ${gameId}
    `;
  }

  async recordGameResult(userId, gameId, result, betAmount, winAmount) {
    const gameResult = await sql`
      INSERT INTO game_results (user_id, game_id, result, bet_amount, win_amount)
      VALUES (${userId}, ${gameId}, ${result}, ${betAmount}, ${winAmount})
      RETURNING *
    `;
    return gameResult[0];
  }

  async getGameResult(resultId) {
    const result = await sql`
      SELECT 
        gr.*,
        u.username,
        g.name as game_name
      FROM game_results gr
      JOIN users u ON gr.user_id = u.user_id
      JOIN games g ON gr.game_id = g.game_id
      WHERE gr.result_id = ${resultId}
    `;
    return result[0] || null;
  }

  async getUserGameHistory(userId, limit = 20) {
    return await sql`
      SELECT 
        gr.*,
        g.name as game_name
      FROM game_results gr
      JOIN games g ON gr.game_id = g.game_id
      WHERE gr.user_id = ${userId}
      ORDER BY gr.timestamp DESC
      LIMIT ${limit}
    `;
  }

  async getGameHistory(gameId, limit = 50) {
    return await sql`
      SELECT 
        gr.*,
        u.username
      FROM game_results gr
      JOIN users u ON gr.user_id = u.user_id
      WHERE gr.game_id = ${gameId}
      ORDER BY gr.timestamp DESC
      LIMIT ${limit}
    `;
  }

  async getRecentGames(limit = 50) {
    return await sql`
      SELECT * FROM recent_games LIMIT ${limit}
    `;
  }

  async deleteGameResult(resultId) {
    await sql`
      DELETE FROM game_results WHERE result_id = ${resultId}
    `;
  }

  async getLeaderboard(limit = 10) {
    return await sql`
      SELECT 
        u.username,
        u.tokens,
        l.total_wins,
        l.total_games,
        CASE 
          WHEN l.total_games > 0 THEN 
            ROUND((l.total_wins::decimal / l.total_games) * 100, 2)
          ELSE 0 
        END as win_rate
      FROM users u
      INNER JOIN leaderboard l ON u.user_id = l.user_id
      ORDER BY u.tokens DESC
      LIMIT ${limit}
    `;
  }

  async getLeaderboardByWins(limit = 10) {
    return await sql`
      SELECT 
        u.username,
        u.tokens,
        l.total_wins,
        l.total_games,
        CASE 
          WHEN l.total_games > 0 THEN 
            ROUND((l.total_wins::decimal / l.total_games) * 100, 2)
          ELSE 0 
        END as win_rate
      FROM users u
      INNER JOIN leaderboard l ON u.user_id = l.user_id
      ORDER BY l.total_wins DESC
      LIMIT ${limit}
    `;
  }

  async getUserRank(userId) {
    const result = await sql`
      WITH ranked_users AS (
        SELECT 
          user_id,
          ROW_NUMBER() OVER (ORDER BY tokens DESC) as rank
        FROM users
      )
      SELECT rank FROM ranked_users WHERE user_id = ${userId}
    `;
    return result[0]?.rank || null;
  }

  async getLeaderboardEntry(userId) {
    const result = await sql`
      SELECT * FROM leaderboard WHERE user_id = ${userId}
    `;
    return result[0] || null;
  }

  async updateLeaderboard(userId, won) {
    await sql`
      INSERT INTO leaderboard (user_id, total_wins, total_games)
      VALUES (${userId}, ${won ? 1 : 0}, 1)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        total_wins = leaderboard.total_wins + ${won ? 1 : 0},
        total_games = leaderboard.total_games + 1
    `;
  }

  async getAllItems() {
    return await sql`
      SELECT * FROM items ORDER BY cost_tokens
    `;
  }

  async getItem(itemId) {
    const result = await sql`
      SELECT * FROM items WHERE item_id = ${itemId}
    `;
    return result[0] || null;
  }

  async getItemByName(name) {
    const result = await sql`
      SELECT * FROM items WHERE name = ${name}
    `;
    return result[0] || null;
  }

  async createItem(name, description, costTokens) {
    const result = await sql`
      INSERT INTO items (name, description, cost_tokens)
      VALUES (${name}, ${description}, ${costTokens})
      RETURNING *
    `;
    return result[0];
  }

  async updateItem(itemId, updates) {
    const { name, description, cost_tokens } = updates;
    const result = await sql`
      UPDATE items
      SET name = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          cost_tokens = COALESCE(${cost_tokens}, cost_tokens)
      WHERE item_id = ${itemId}
      RETURNING *
    `;
    return result[0];
  }

  async deleteItem(itemId) {
    await sql`
      DELETE FROM items WHERE item_id = ${itemId}
    `;
  }

  async getUserInventory(userId) {
    return await sql`
      SELECT 
        inv.*,
        i.name,
        i.description,
        i.cost_tokens
      FROM inventory inv
      JOIN items i ON inv.item_id = i.item_id
      WHERE inv.user_id = ${userId}
      ORDER BY inv.inventory_id DESC
    `;
  }

  async getInventoryItem(inventoryId) {
    const result = await sql`
      SELECT 
        inv.*,
        i.name,
        i.description
      FROM inventory inv
      JOIN items i ON inv.item_id = i.item_id
      WHERE inv.inventory_id = ${inventoryId}
    `;
    return result[0] || null;
  }

  async hasItem(userId, itemId) {
    const result = await sql`
      SELECT * FROM inventory 
      WHERE user_id = ${userId} AND item_id = ${itemId}
    `;
    return result.length > 0;
  }

  async addItemToInventory(userId, itemId, quantity = 1) {
    const result = await sql`
      INSERT INTO inventory (user_id, item_id, quantity)
      VALUES (${userId}, ${itemId}, ${quantity})
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET quantity = inventory.quantity + ${quantity}
      RETURNING *
    `;
    return result[0];
  }

  async updateInventoryQuantity(inventoryId, quantity) {
    const result = await sql`
      UPDATE inventory
      SET quantity = ${quantity}
      WHERE inventory_id = ${inventoryId}
      RETURNING *
    `;
    return result[0];
  }

  async removeItemFromInventory(userId, itemId, quantity = 1) {
    const current = await sql`
      SELECT quantity FROM inventory 
      WHERE user_id = ${userId} AND item_id = ${itemId}
    `;

    if (!current[0]) return null;

    if (current[0].quantity <= quantity) {
      await sql`
        DELETE FROM inventory 
        WHERE user_id = ${userId} AND item_id = ${itemId}
      `;
      return { removed: true };
    } else {
      const result = await sql`
        UPDATE inventory
        SET quantity = quantity - ${quantity}
        WHERE user_id = ${userId} AND item_id = ${itemId}
        RETURNING *
      `;
      return result[0];
    }
  }

  async deleteInventoryItem(inventoryId) {
    await sql`
      DELETE FROM inventory WHERE inventory_id = ${inventoryId}
    `;
  }

  async purchaseItem(userId, itemId) {
    const user = await this.getUser(userId);
    const item = await this.getItem(itemId);

    if (!user || !item) {
      return { success: false, message: 'User or item not found' };
    }

    if (user.tokens < item.cost_tokens) {
      return { success: false, message: 'Not enough tokens' };
    }

    await this.updateTokens(userId, -item.cost_tokens);

    await this.addItemToInventory(userId, itemId, 1);

    return { 
      success: true, 
      message: `Purchased ${item.name} for ${item.cost_tokens} tokens!`,
      item 
    };
  }

  async healthCheck() {
    try {
      const result = await sql`SELECT NOW()`;
      return { healthy: true, time: result[0].now };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async getDatabaseStats() {
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM game_results) as total_games,
        (SELECT SUM(tokens) FROM users) as total_tokens,
        (SELECT COUNT(*) FROM items) as total_items,
        (SELECT COUNT(*) FROM inventory) as total_inventory_items
    `;
    return stats[0];
  }

  async clearAllData() {
    await sql`TRUNCATE TABLE inventory CASCADE`;
    await sql`TRUNCATE TABLE game_results CASCADE`;
    await sql`TRUNCATE TABLE leaderboard CASCADE`;
    await sql`TRUNCATE TABLE items CASCADE`;
    await sql`TRUNCATE TABLE games CASCADE`;
    await sql`TRUNCATE TABLE users CASCADE`;
  }
}

module.exports = new Database();