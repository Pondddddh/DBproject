class GameManager {
  constructor() {
    this.sessions = new Map(); // channelId → GameSession
  }

  startGame(channelId, gameInstance, gameName) {
    this.sessions.set(channelId, {
      gameName,
      instance: gameInstance,
      startedAt: Date.now()
    });
    return true;
  }

  getGame(channelId) {
    return this.sessions.get(channelId);
  }


  hasActiveGame(channelId) {
    return this.sessions.has(channelId);
  }

  endGame(channelId) {
    const session = this.sessions.get(channelId);
    this.sessions.delete(channelId);
    return session;
  }

  getAllSessions() {
    return Array.from(this.sessions.entries()).map(([channelId, session]) => ({
      channelId,
      ...session
    }));
  }
  
  clearAll() {
    this.sessions.clear();
  }
}

module.exports = new GameManager();