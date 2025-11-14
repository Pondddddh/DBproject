const { Deck } = require('../utils/Deck');

/**
 * Blackjack Game - Player vs Dealer
 */
class Blackjack {
  constructor(channelId, userId) {
    this.channelId = channelId;
    this.userId = userId;
    this.deck = null;
    this.playerHand = [];
    this.dealerHand = [];
    this.gameOver = false;
    this.result = null;
    this.bet = 0;
    this.canDoubleDown = false;
  }

  /**
   * Start a new game
   */
  startGame(betAmount = 10) {
    this.bet = betAmount;
    this.deck = new Deck();
    this.playerHand = [];
    this.dealerHand = [];
    this.gameOver = false;
    this.result = null;
    this.canDoubleDown = true;

    // Deal initial cards
    this.playerHand.push(this.deck.deal());
    this.dealerHand.push(this.deck.deal());
    this.playerHand.push(this.deck.deal());
    this.dealerHand.push(this.deck.deal());

    // Check for immediate blackjack
    if (this.isBlackjack(this.playerHand)) {
      if (this.isBlackjack(this.dealerHand)) {
        this.gameOver = true;
        this.result = 'tie';
      } else {
        this.gameOver = true;
        this.result = 'blackjack';
      }
    }

    return this.getState();
  }

  /**
   * Player hits (takes another card)
   */
  hit() {
    if (this.gameOver) {
      return { success: false, message: 'Game is over' };
    }

    this.canDoubleDown = false;
    const card = this.deck.deal();
    this.playerHand.push(card);

    const playerValue = this.calculateHandValue(this.playerHand);

    if (playerValue > 21) {
      this.gameOver = true;
      this.result = 'bust';
      return {
        success: true,
        card,
        handValue: playerValue,
        busted: true,
        gameOver: true
      };
    }

    return {
      success: true,
      card,
      handValue: playerValue,
      busted: false,
      gameOver: false
    };
  }

  /**
   * Player stands (ends turn)
   */
  stand() {
    if (this.gameOver) {
      return { success: false, message: 'Game is over' };
    }

    this.canDoubleDown = false;

    // Dealer plays - must hit until 17 or higher
    while (this.calculateHandValue(this.dealerHand) < 17) {
      this.dealerHand.push(this.deck.deal());
    }

    const playerValue = this.calculateHandValue(this.playerHand);
    const dealerValue = this.calculateHandValue(this.dealerHand);

    this.gameOver = true;

    // Determine winner
    if (dealerValue > 21) {
      this.result = 'win'; // Dealer busts
    } else if (playerValue > dealerValue) {
      this.result = 'win';
    } else if (playerValue < dealerValue) {
      this.result = 'lose';
    } else {
      this.result = 'tie';
    }

    return {
      success: true,
      dealerHand: this.dealerHand,
      dealerValue,
      playerValue,
      result: this.result,
      gameOver: true
    };
  }

  /**
   * Double down (double bet, take 1 card, auto stand)
   */
  doubleDown() {
    if (this.gameOver) {
      return { success: false, message: 'Game is over' };
    }

    if (!this.canDoubleDown) {
      return { success: false, message: 'Can only double down on first turn' };
    }

    this.bet *= 2;
    const card = this.deck.deal();
    this.playerHand.push(card);

    const playerValue = this.calculateHandValue(this.playerHand);

    if (playerValue > 21) {
      this.gameOver = true;
      this.result = 'bust';
      return {
        success: true,
        card,
        handValue: playerValue,
        busted: true,
        gameOver: true,
        bet: this.bet
      };
    }

    // Auto stand after double down
    return this.stand();
  }

  /**
   * Calculate hand value with Ace handling
   */
  calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      const cardValue = card.getValue();
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else {
        value += cardValue;
      }
    }

    // Adjust Aces from 11 to 1 if needed
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  }

  /**
   * Check if hand is blackjack (21 with 2 cards)
   */
  isBlackjack(hand) {
    return hand.length === 2 && this.calculateHandValue(hand) === 21;
  }

  /**
   * Check if hand is busted (> 21)
   */
  isBusted(hand) {
    return this.calculateHandValue(hand) > 21;
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
      bet: this.bet,
      canDoubleDown: this.canDoubleDown
    };
  }

  /**
   * Format hand for display
   */
  formatHand(hand, hideFirst = false) {
    if (hideFirst && hand.length > 0) {
      const visible = hand.slice(1).map(c => `**${c.rank}${c.suit}**`).join(' ');
      return `🎴 ${visible}`;
    }
    return hand.map(c => `**${c.rank}${c.suit}**`).join(' ');
  }

  /**
   * Get payout based on result
   */
  getPayout() {
    if (this.result === 'blackjack') return this.bet * 2.5; // 1.5x win
    if (this.result === 'win') return this.bet * 2;
    if (this.result === 'tie') return this.bet;
    return 0; // lose or bust
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
    this.canDoubleDown = false;
  }
}

module.exports = Blackjack;