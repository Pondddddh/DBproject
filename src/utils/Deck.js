import { Card } from './card.js';
import { randomInt } from './Helpers.js';

export class Deck {
  constructor() {
    this.cards = this.createDeck();
    this.shuffle();
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(new Card(suit, rank));
      }
    }
    return deck;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal() {
    return this.cards.pop();
  }

  remaining() {
    return this.cards.length;
  }
}