const { Deck } = require('../utils/deck');

/**
 * Poker Game - Texas Hold'em (simplified for Discord)
 * Multiplayer: 2-8 players
 */
class Poker {
  constructor(channelId, hostId) {
    this.channelId = channelId;
    this.hostId = hostId;
    this.players = new Map(); // userId → { hand, chips, bet, folded, position }
    this.deck = null;
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.currentPlayerIndex = 0;
    this.round = 'waiting'; // waiting, preflop, flop, turn, river, showdown
    this.dealerPosition = 0;
    this.smallBlind = 10;
    this.bigBlind = 20;
  }

  /**
   * Add player to game
   * TODO:
   * - Check if game started
   * - Check max players (8)
   * - Add player with starting chips
   */
  addPlayer(userId, username, startingChips = 1000) {
    // Add player to game
    // return success/failure
  }

  /**
   * Remove player from game
   */
  removePlayer(userId) {
    // Remove player
  }

  /**
   * Start the game (lock players, begin rounds)
   * TODO:
   * - Require at least 2 players
   * - Shuffle deck
   * - Post blinds
   * - Deal hole cards (2 per player)
   */
  startGame() {
    // Validate player count
    // Create and shuffle deck
    // Post blinds
    // Deal hole cards
    // Set round to 'preflop'
  }

  /**
   * Deal hole cards (2 cards to each player)
   * TODO: Deal 2 cards face down to each player
   */
  dealHoleCards() {
    // Deal 2 cards to each player
  }

  /**
   * Deal community cards based on round
   * TODO:
   * - Flop: 3 cards
   * - Turn: 1 card
   * - River: 1 card
   */
  dealCommunityCards() {
    // Deal based on current round
  }

  /**
   * Player action: Call (match current bet)
   * TODO:
   * - Match current bet
   * - Add to pot
   * - Move to next player
   */
  call(userId) {
    // Player matches bet
    // Update pot
  }

  /**
   * Player action: Raise (increase bet)
   * TODO:
   * - Increase current bet
   * - Update pot
   * - Reset action to other players
   */
  raise(userId, amount) {
    // Player raises bet
    // Update currentBet
    // Update pot
  }

  /**
   * Player action: Fold (give up hand)
   * TODO:
   * - Mark player as folded
   * - Check if only 1 player remains (auto win)
   */
  fold(userId) {
    // Player folds
    // Check for auto-win
  }

  /**
   * Player action: Check (pass action, no bet)
   * TODO: Only allowed if currentBet === player's bet
   */
  check(userId) {
    // Player checks
  }

  /**
   * Move to next betting round
   * TODO:
   * - preflop → flop (deal 3 cards)
   * - flop → turn (deal 1 card)
   * - turn → river (deal 1 card)
   * - river → showdown
   */
  nextRound() {
    // Progress to next round
    // Deal cards if needed
    // Reset bets
  }

  /**
   * Evaluate all hands and determine winner
   * TODO:
   * - Evaluate each non-folded player's hand
   * - Determine best hand
   * - Award pot to winner(s)
   * - Handle split pots
   */
  showdown() {
    // Evaluate all hands
    // Determine winner
    // Distribute pot
    // return { winner, hand, amount }
  }

  /**
   * Evaluate poker hand (5 cards from 7 total)
   * TODO:
   * - Generate all 5-card combinations from player's 2 + community 5
   * - Rank each hand
   * - Return best hand with rank
   * 
   * Hand Rankings (lowest to highest):
   * 0: High Card
   * 1: One Pair
   * 2: Two Pair
   * 3: Three of a Kind
   * 4: Straight
   * 5: Flush
   * 6: Full House
   * 7: Four of a Kind
   * 8: Straight Flush
   * 9: Royal Flush
   */
  evaluateHand(playerCards, communityCards) {
    // Combine player + community cards
    // Find best 5-card hand
    // return { rank, cards, name }
  }

  /**
   * Check for specific hand types
   */
  isRoyalFlush(cards) { }
  isStraightFlush(cards) { }
  isFourOfAKind(cards) { }
  isFullHouse(cards) { }
  isFlush(cards) { }
  isStraight(cards) { }
  isThreeOfAKind(cards) { }
  isTwoPair(cards) { }
  isOnePair(cards) { }

  /**
   * Get current game state
   */
  getState() {
    return {
      players: Array.from(this.players.entries()),
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      round: this.round,
      currentPlayer: this.getCurrentPlayer()
    };
  }

  /**
   * Get current player whose turn it is
   */
  getCurrentPlayer() {
    // Return current player
  }

  /**
   * Move to next player
   */
  nextPlayer() {
    // Skip folded players
    // Wrap around if needed
  }

  /**
   * Format cards for display
   */
  formatCards(cards, hidden = false) {
    // Format cards with emojis
    // Hide if needed (opponent hands)
  }

  /**
   * Reset for new game
   */
  reset() {
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.round = 'waiting';
    // Reset player hands but keep chips
  }
}

module.exports = Poker;

/**
 * IMPLEMENTATION NOTES FOR YOUR MATE:
 * 
 * 1. Texas Hold'em Basics:
 *    - Each player gets 2 hole cards (private)
 *    - 5 community cards dealt in stages (flop, turn, river)
 *    - Make best 5-card hand from any combination
 * 
 * 2. Betting Rounds:
 *    - Pre-flop: After hole cards
 *    - Flop: After first 3 community cards
 *    - Turn: After 4th community card
 *    - River: After 5th community card
 *    - Showdown: Reveal and compare hands
 * 
 * 3. Blinds:
 *    - Small blind: Player left of dealer (e.g., 10 chips)
 *    - Big blind: Player left of small blind (e.g., 20 chips)
 *    - Rotate each round
 * 
 * 4. Actions:
 *    - Fold: Give up hand
 *    - Check: Pass (only if no bet)
 *    - Call: Match current bet
 *    - Raise: Increase bet
 *    - All-in: Bet all chips
 * 
 * 5. Hand Evaluation:
 *    - Must evaluate best 5-card combo from 7 cards
 *    - Consider all possible 5-card combinations
 *    - Compare using standard poker rankings
 * 
 * 6. Button Actions Needed:
 *    - Join Game
 *    - Start Game (host only)
 *    - Fold
 *    - Check
 *    - Call
 *    - Raise (with amount input)
 *    - All-in
 * 
 * 7. Discord-Specific:
 *    - DM players their hole cards (use interaction.user.send())
 *    - Show community cards in channel
 *    - Track turn order with mentions
 *    - Consider timeout for inactive players
 */