const { Deck } = require('../utils/deck');

/**
 * Blackjack Game - Player vs Dealer
 * Goal: Get as close to 21 as possible without going over
 */
class Blackjack {
  constructor(channelId, userId) {
    this.channelId = channelId;
    this.userId = userId;
    this.deck = null;
    this.playerHand = [];
    this.dealerHand = [];
    this.gameOver = false;
    this.result = null; // 'win', 'lose', 'tie', 'blackjack'
    this.bet = 0;
  }

  /**
   * Start a new game
   * TODO: 
   * - Create and shuffle deck
   * - Deal 2 cards to player
   * - Deal 2 cards to dealer (1 face down)
   * - Check for immediate blackjack
   */
  startGame(betAmount = 0) {
    // this.deck = new Deck();
    // Deal initial cards
    // Check blackjack
  }

  /**
   * Player hits (takes another card)
   * TODO:
   * - Deal one card to player
   * - Calculate new hand value
   * - Check if busted (> 21)
   * - Return card and status
   */
  hit() {
    // Deal card to player
    // Check if bust
    // return { card, handValue, busted }
  }

  /**
   * Player stands (ends turn)
   * TODO:
   * - Reveal dealer's hidden card
   * - Dealer draws until >= 17
   * - Compare hands
   * - Determine winner
   */
  stand() {
    // Dealer plays
    // Compare hands
    // Set game result
    // return { dealerHand, dealerValue, result }
  }

  /**
   * Double down (double bet, take 1 card, auto stand)
   * TODO:
   * - Double the bet
   * - Hit once
   * - Auto stand
   */
  doubleDown() {
    // Implement double down logic
  }

  /**
   * Calculate hand value
   * TODO:
   * - Sum card values
   * - Handle Aces (1 or 11)
   * - Return best possible value
   */
  calculateHandValue(hand) {
    // Calculate value with Ace handling
    // return value
  }

  /**
   * Check if hand is blackjack (21 with 2 cards)
   */
  isBlackjack(hand) {
    // return hand.length === 2 && this.calculateHandValue(hand) === 21
  }

  /**
   * Check if hand is busted (> 21)
   */
  isBusted(hand) {
    // return this.calculateHandValue(hand) > 21
  }

  /**
   * Get current game state
   */
  getState() {
    return {
      playerHand: this.playerHand,
      dealerHand: this.dealerHand,
      playerValue: this.calculateHandValue(this.playerHand),
      dealerValue: this.gameOver ? this.calculateHandValue(this.dealerHand) : null,
      gameOver: this.gameOver,
      result: this.result,
      bet: this.bet
    };
  }

  /**
   * Format hand for display
   * TODO: Return formatted string like "A♠ K♥ (21)"
   */
  formatHand(hand, hideFirst = false) {
    // Format cards with emojis
    // return formatted string
  }

  /**
   * Reset for new game
   */
  reset() {
    this.deck = null;
    this.playerHand = [];
    this.dealerHand = [];
    this.gameOver = false;
    this.result = null;
  }
}

module.exports = Blackjack;

/**
 * IMPLEMENTATION NOTES FOR YOUR MATE:
 * 
 * 1. Card Values:
 *    - Number cards (2-10): Face value
 *    - Face cards (J, Q, K): 10
 *    - Ace: 1 or 11 (whichever is better)
 * 
 * 2. Game Flow:
 *    - Player and dealer get 2 cards
 *    - Dealer shows 1 card face up
 *    - Player can hit/stand/double
 *    - Dealer must hit until 17+
 *    - Compare final hands
 * 
 * 3. Winning Conditions:
 *    - Blackjack (21 with 2 cards): Player wins 1.5x
 *    - Player closer to 21: Win
 *    - Player busts (> 21): Lose
 *    - Dealer busts: Player wins
 *    - Same value: Push (tie)
 * 
 * 4. Button Actions Needed:
 *    - Hit
 *    - Stand
 *    - Double Down (if first turn)
 *    - New Game
 */