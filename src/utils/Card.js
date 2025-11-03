export class Card {
  constructor(suit, rank) {
    this.suit = suit; 
    this.rank = rank;
  }

  // it will Return something like "A♠" naaaaa
toString() {
    return `${this.rank}${this.suit}`;
  }

  // For Blackjack scoring
getValue() {
    if (['J', 'Q', 'K'].includes(this.rank)) return 10;
    if (this.rank === 'A') return 11; // Aces handled najaaaa
    return parseInt(this.rank);
  }
}