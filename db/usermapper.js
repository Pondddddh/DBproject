class UserMapper {
  constructor() {
    this.cache = new Map(); // discordId -> dbUserId
    this.reverseCache = new Map(); // dbUserId -> discordId
  }


  async getOrCreateUser(discordId, username) {
    // Check cache first
    if (this.cache.has(discordId)) {
      const dbUserId = this.cache.get(discordId);
      const user = await db.getUser(dbUserId);
      return {
        discordId,
        dbUserId,
        user,
        authenticated: true
      };
    }

    // Check if user exists by email (using discord ID as email)
    const email = `${discordId}@discord.user`;
    let user = await db.getUserByEmail(email);

    if (!user) {
      user = await db.createUser(
        username,
        'discord_auth',
        email,
        'player',
        1000 
      );
    }

    // Cache the mapping
    this.cache.set(discordId, user.user_id);
    this.reverseCache.set(user.user_id, discordId);

    return {
      discordId,
      dbUserId: user.user_id,
      user,
      authenticated: true
    };
  }

  async authenticate(discordId, username) {
    return await this.getOrCreateUser(discordId, username);
  }


  isAuthenticated(discordId) {
    return discordId !== null && discordId !== undefined;
  }


  async checkPermission(discordId, requiredRole) {
    const userData = await this.getOrCreateUser(discordId, 'unknown');
    
    const roleHierarchy = {
      'player': 0,
      'vip': 1,
      'admin': 2
    };

    const userLevel = roleHierarchy[userData.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }


  async isBanned(discordId) {
    try {
      const userData = await this.getOrCreateUser(discordId, 'unknown');
      return userData.user.role === 'banned';
    } catch (error) {
      return false;
    }
  }
}

module.exports = new UserMapper();