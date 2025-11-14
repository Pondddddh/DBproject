module.exports = {
  GAMES: {
    BLACKJACK: {
      NAME: 'blackjack',
      MIN_BET: 10,
      MAX_BET: 10000,
      DEFAULT_BET: 10,
      BLACKJACK_MULTIPLIER: 2.5,
      WIN_MULTIPLIER: 2
    },
    POKER: {
      NAME: 'poker',
      MIN_PLAYERS: 2,
      MAX_PLAYERS: 8,
      DEFAULT_SMALL_BLIND: 10,
      DEFAULT_BIG_BLIND: 20,
      DEFAULT_STARTING_CHIPS: 1000,
      TIMEOUT_SECONDS: 30
    },
    GAME24: {
      NAME: 'game24',
      TARGET_NUMBER: 24,
      NUMBER_COUNT: 4,
      MIN_NUMBER: 1,
      MAX_NUMBER: 9
    }
  },


  ECONOMY: {
    STARTING_TOKENS: parseInt(process.env.STARTING_TOKENS) || 1000,
    MAX_TOKENS: 1000000,
    MIN_BET: 1,
    DAILY_REWARD_BASE: parseInt(process.env.DAILY_REWARD_BASE) || 100,
    DAILY_REWARD_STREAK_BONUS: parseInt(process.env.DAILY_REWARD_STREAK_BONUS) || 10,
    MAX_DAILY_REWARD: parseInt(process.env.MAX_DAILY_REWARD) || 500,
    GIFT_MIN: 10,
    GIFT_MAX: 10000
  },

  ROLES: {
    PLAYER: 'player',
    VIP: 'vip',
    ADMIN: 'admin',
    BANNED: 'banned'
  },


  ITEM_TYPES: {
    BADGE: 'badge',
    BOOST: 'boost',
    COSMETIC: 'cosmetic',
    TITLE: 'title'
  },


  COLORS: {
    SUCCESS: '#00FF00',
    ERROR: '#FF0000',
    WARNING: '#FFA500',
    INFO: '#3498DB',
    PRIMARY: '#FFD700',
    GAME: '#9B59B6'
  },


  EMOJIS: {
    TOKENS: '💰',
    WIN: '🎉',
    LOSE: '😢',
    TIE: '🤝',
    CARDS: '🎴',
    TROPHY: '🏆',
    FIRE: '🔥',
    STAR: '⭐',
    BADGE: '🏅',
    BOOST: '⚡',
    COSMETIC: '✨',
    TITLE: '👑',
    GIFT: '🎁',
    SHOP: '🏪',
    INVENTORY: '🎒',
    STATS: '📊',
    HISTORY: '📜',
    LEADERBOARD: '🏆',
    RANK: '📈',
    DAILY: '📅',
    PROFILE: '👤'
  },

  GAME_RESULTS: {
    WIN: 'win',
    LOSE: 'lose',
    TIE: 'tie',
    BUST: 'bust',
    BLACKJACK: 'blackjack'
  },

  POKER_HANDS: {
    HIGH_CARD: { rank: 0, name: 'High Card' },
    ONE_PAIR: { rank: 1, name: 'One Pair' },
    TWO_PAIR: { rank: 2, name: 'Two Pair' },
    THREE_OF_A_KIND: { rank: 3, name: 'Three of a Kind' },
    STRAIGHT: { rank: 4, name: 'Straight' },
    FLUSH: { rank: 5, name: 'Flush' },
    FULL_HOUSE: { rank: 6, name: 'Full House' },
    FOUR_OF_A_KIND: { rank: 7, name: 'Four of a Kind' },
    STRAIGHT_FLUSH: { rank: 8, name: 'Straight Flush' },
    ROYAL_FLUSH: { rank: 9, name: 'Royal Flush' }
  },

  ERRORS: {
    NOT_ENOUGH_TOKENS: 'Not enough tokens!',
    GAME_ACTIVE: 'A game is already active in this channel!',
    NO_GAME: 'No active game found.',
    NOT_YOUR_TURN: 'It\'s not your turn!',
    INVALID_BET: 'Invalid bet amount!',
    USER_NOT_FOUND: 'User not found!',
    ITEM_NOT_FOUND: 'Item not found!',
    DATABASE_ERROR: 'Database error occurred.',
    ALREADY_CLAIMED: 'Already claimed today!',
    PERMISSION_DENIED: 'You don\'t have permission to do that!',
    COOLDOWN: 'Please wait before using this command again.'
  },

  SUCCESS: {
    GAME_STARTED: 'Game started successfully!',
    PURCHASE_COMPLETE: 'Purchase completed!',
    DAILY_CLAIMED: 'Daily reward claimed!',
    GIFT_SENT: 'Gift sent successfully!',
    ITEM_EQUIPPED: 'Item equipped!'
  },

  COOLDOWNS: {
    DAILY: 86400, // 24 hours
    GIFT: 60, // 1 minute
    SHOP: 5,
    BALANCE: 3
  },

  LIMITS: {
    LEADERBOARD_MAX: 25,
    HISTORY_MAX: 50,
    INVENTORY_MAX: 100,
    USERNAME_LENGTH: 32,
    MESSAGE_LENGTH: 2000
  },

  PAGINATION: {
    ITEMS_PER_PAGE: 10,
    HISTORY_PER_PAGE: 10,
    LEADERBOARD_PER_PAGE: 10
  },

  MULTIPLAYER: {
    MAX_PLAYERS_PER_GAME: 8,
    WAIT_TIME: 30, // seconds
    TURN_TIMEOUT: 60 // seconds
  }
};