// GameManager.js
class GameManager {
  constructor() {
    this.sessions = new Map(); // channelId → { gameName, data }
  }

  startGame(channelId, game) {
    this.sessions.set(channelId, { gameName: game.constructor.name, data: game });
  }

  getGame(channelId) {
    return this.sessions.get(channelId);
  }

  endGame(channelId) {
    this.sessions.delete(channelId);
  }
}

module.exports = GameManager;
