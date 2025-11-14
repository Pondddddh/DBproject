const db = require('./database');

class UserMapper {
  constructor() {
    this.cache = new Map();
    this.reverseCache = new Map();
  }

  async getOrCreateUser(discordId, username) {
  if (this.cache.has(discordId)) {
    const dbUserId = this.cache.get(discordId);
    const user = await db.getUser(dbUserId);
    if (user) {
      return { discordId, dbUserId, user };
    }
  }

  const email = `${discordId}@discord.user`;
  
  // Try to find user by username first (fallback)
  let user = await db.getUserByUsername(username);
  
  if (!user) {
    // Check by email
    const allUsers = await sql`SELECT * FROM users WHERE email = ${email}`;
    user = allUsers[0];
  }

  if (!user) {
    // Create new user
    user = await db.createUser(username, 'discord_auth', email, 'player', 1000);
  }

  this.cache.set(discordId, user.user_id);
  this.reverseCache.set(user.user_id, discordId);

  return { discordId, dbUserId: user.user_id, user };
}

  async getDiscordId(dbUserId) {
    if (this.reverseCache.has(dbUserId)) {
      return this.reverseCache.get(dbUserId);
    }

    const user = await db.getUser(dbUserId);
    if (!user) return null;

    const discordId = user.email.replace('@discord.user', '');

    this.cache.set(discordId, dbUserId);
    this.reverseCache.set(dbUserId, discordId);

    return discordId;
  }

  async authenticate(discordId, username) {
    return await this.getOrCreateUser(discordId, username);
  }

  async updateUsername(discordId, newUsername) {
    const dbUserId = await this.getDbUserId(discordId, newUsername);
    await db.updateUser(dbUserId, { username: newUsername });
  }

  clearCache() {
    this.cache.clear();
    this.reverseCache.clear();
  }
}

module.exports = new UserMapper();