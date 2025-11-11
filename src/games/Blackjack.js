const { Deck } = require('../utils/deck');

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

  startGame(betAmount = 0) {
    this.reset();
    this.deck = new Deck();
    this.deck.shuffle();
    this.bet = betAmount;

    this.playerHand.push(this.deck.draw());
    this.dealerHand.push(this.deck.draw());
    this.playerHand.push(this.deck.draw());
    this.dealerHand.push(this.deck.draw());

    this.canDoubleDown = true;

    const playerValue = this.calculateHandValue(this.playerHand);
    const dealerValue = this.calculateHandValue(this.dealerHand);

    if (this.isBlackjack(this.playerHand) && this.isBlackjack(this.dealerHand)) {
      this.gameOver = true;
      this.result = 'tie';
    } else if (this.isBlackjack(this.playerHand)) {
      this.gameOver = true;
      this.result = 'blackjack';
    } else if (this.isBlackjack(this.dealerHand)) {
      this.gameOver = true;
      this.result = 'lose';
    }

    return this.getState();
  }

  hit() {
    if (this.gameOver) return this.getState();

    this.canDoubleDown = false;
    const card = this.deck.draw();
    this.playerHand.push(card);

    const value = this.calculateHandValue(this.playerHand);

    if (value > 21) {
      this.gameOver = true;
      this.result = 'lose';
    }

    return {
      card,
      handValue: value,
      busted: this.isBusted(this.playerHand),
      ...this.getState()
    };
  }

  stand() {
    if (this.gameOver) return this.getState();

    this.canDoubleDown = false;

    while (this.calculateHandValue(this.dealerHand) < 17) {
      this.dealerHand.push(this.deck.draw());
    }

    const playerValue = this.calculateHandValue(this.playerHand);
    const dealerValue = this.calculateHandValue(this.dealerHand);

    this.gameOver = true;

    if (dealerValue > 21) {
      this.result = 'win';
    } else if (playerValue > dealerValue) {
      this.result = 'win';
    } else if (playerValue < dealerValue) {
      this.result = 'lose';
    } else {
      this.result = 'tie';
    }

    return {
      dealerHand: this.dealerHand,
      dealerValue,
      result: this.result,
      ...this.getState()
    };
  }

  doubleDown() {
    if (!this.canDoubleDown || this.gameOver) return this.getState();

    this.bet *= 2;
    const card = this.deck.draw();
    this.playerHand.push(card);
    const value = this.calculateHandValue(this.playerHand);

    if (value > 21) {
      this.gameOver = true;
      this.result = 'lose';
    } else {
      return this.stand();
    }

    return {
      card,
      value,
      result: this.result,
      ...this.getState()
    };
  }

  calculateHandValue(hand) {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
      const rank = card.rank;
      if (['J', 'Q', 'K'].includes(rank)) {
        total += 10;
      } else if (rank === 'A') {
        aces += 1;
        total += 11;
      } else {
        total += parseInt(rank);
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  }

  isBlackjack(hand) {
    return hand.length === 2 && this.calculateHandValue(hand) === 21;
  }

  isBusted(hand) {
    return this.calculateHandValue(hand) > 21;
  }

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

  formatHand(hand, hideFirst = false) {
    return hand
      .map((card, i) => {
        if (hideFirst && i === 0) return '🂠';
        const suitSymbol = {
          '♠': '♠',
          '♥': '♥',
          '♦': '♦',
          '♣': '♣'
        }[card.suit] || card.suit;
        return `${card.rank}${suitSymbol}`;
      })
      .join(' ');
  }

  reset() {
    this.deck = null;
    this.playerHand = [];
    this.dealerHand = [];
    this.gameOver = false;
    this.result = null;
    this.bet = 0;
    this.canDoubleDown = false;
  }
}

module.exports = Blackjack;
