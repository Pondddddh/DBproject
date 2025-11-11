const { Deck } = require('../utils/deck');

class Poker {
  constructor(channelId, hostId) {
    this.channelId = channelId;
    this.hostId = hostId;
    this.players = new Map(); // userId → { username, hand, chips, bet, folded, position }
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

  /** Add player */
  addPlayer(userId, username, startingChips = 1000) {
    if (this.round !== 'waiting') return { success: false, message: 'Game already started.' };
    if (this.players.size >= 8) return { success: false, message: 'Table full (8 max).' };
    if (this.players.has(userId)) return { success: false, message: 'Player already joined.' };

    const position = this.players.size;
    this.players.set(userId, {
      username,
      hand: [],
      chips: startingChips,
      bet: 0,
      folded: false,
      position
    });
    return { success: true, message: `${username} joined the game.` };
  }

  /** Remove player */
  removePlayer(userId) {
    if (!this.players.has(userId)) return false;
    this.players.delete(userId);
    return true;
  }

  /** Start game */
  startGame() {
    if (this.players.size < 2) return { success: false, message: 'Need at least 2 players.' };

    this.deck = new Deck();
    this.deck.shuffle();

    this.round = 'preflop';
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;

    this.postBlinds();
    this.dealHoleCards();

    this.currentPlayerIndex = (this.dealerPosition + 3) % this.players.size;
    return { success: true, message: 'Game started.' };
  }

  /** Post small and big blinds */
  postBlinds() {
    const playerArray = Array.from(this.players.entries());
    const smallBlindPos = (this.dealerPosition + 1) % playerArray.length;
    const bigBlindPos = (this.dealerPosition + 2) % playerArray.length;

    const smallBlindPlayer = playerArray[smallBlindPos][1];
    const bigBlindPlayer = playerArray[bigBlindPos][1];

    smallBlindPlayer.bet = this.smallBlind;
    bigBlindPlayer.bet = this.bigBlind;
    smallBlindPlayer.chips -= this.smallBlind;
    bigBlindPlayer.chips -= this.bigBlind;

    this.currentBet = this.bigBlind;
    this.pot += this.smallBlind + this.bigBlind;
  }

  /** Deal hole cards */
  dealHoleCards() {
    for (let i = 0; i < 2; i++) {
      for (const [, player] of this.players) {
        player.hand.push(this.deck.draw());
      }
    }
  }

  /** Deal community cards */
  dealCommunityCards() {
    if (this.round === 'flop') {
      this.deck.burn();
      this.communityCards.push(this.deck.draw(), this.deck.draw(), this.deck.draw());
    } else if (this.round === 'turn' || this.round === 'river') {
      this.deck.burn();
      this.communityCards.push(this.deck.draw());
    }
  }

  /** Call */
  call(userId) {
    const player = this.players.get(userId);
    if (!player || player.folded) return false;

    const callAmount = this.currentBet - player.bet;
    if (callAmount > player.chips) return false; // can't afford

    player.chips -= callAmount;
    player.bet += callAmount;
    this.pot += callAmount;
    this.nextPlayer();
    return true;
  }

  /** Raise */
  raise(userId, amount) {
    const player = this.players.get(userId);
    if (!player || player.folded) return false;

    const totalRaise = this.currentBet - player.bet + amount;
    if (totalRaise > player.chips) return false;

    player.chips -= totalRaise;
    player.bet += totalRaise;
    this.currentBet = player.bet;
    this.pot += totalRaise;

    this.nextPlayer();
    return true;
  }

  /** Fold */
  fold(userId) {
    const player = this.players.get(userId);
    if (!player) return false;
    player.folded = true;

    // Auto-win check
    const activePlayers = Array.from(this.players.values()).filter(p => !p.folded);
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += this.pot;
      this.round = 'waiting';
      return { autoWin: true, winner: winner.username };
    }

    this.nextPlayer();
    return true;
  }

  /** Check */
  check(userId) {
    const player = this.players.get(userId);
    if (!player || player.folded) return false;
    if (player.bet !== this.currentBet) return false;

    this.nextPlayer();
    return true;
  }

  /** Next round */
  nextRound() {
    if (this.round === 'preflop') this.round = 'flop';
    else if (this.round === 'flop') this.round = 'turn';
    else if (this.round === 'turn') this.round = 'river';
    else if (this.round === 'river') {
      this.round = 'showdown';
      return this.showdown();
    }

    this.dealCommunityCards();
    this.resetBets();
  }

  /** Reset bets for next round */
  resetBets() {
    for (const [, player] of this.players) player.bet = 0;
    this.currentBet = 0;
  }

  /** Showdown */
  showdown() {
    const activePlayers = Array.from(this.players.values()).filter(p => !p.folded);

    // Dummy evaluation: random winner (replace with evaluateHand)
    const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    winner.chips += this.pot;

    const result = { winner: winner.username, pot: this.pot };
    this.round = 'waiting';
    this.pot = 0;
    return result;
  }

  /** Placeholder evaluation logic */
  evaluateHand(playerCards, communityCards) {
    return { rank: 0, name: 'High Card', cards: [...playerCards, ...communityCards].slice(0, 5) };
  }

  /** Get current state */
  getState() {
    return {
      players: Array.from(this.players.entries()).map(([id, p]) => ({
        id,
        username: p.username,
        chips: p.chips,
        bet: p.bet,
        folded: p.folded,
        hand: p.hand
      })),
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      round: this.round,
      currentPlayer: this.getCurrentPlayer()
    };
  }

  /** Current player */
  getCurrentPlayer() {
    const playerArray = Array.from(this.players.entries());
    return playerArray[this.currentPlayerIndex] ? playerArray[this.currentPlayerIndex][1] : null;
  }

  /** Move to next player */
  nextPlayer() {
    const playerArray = Array.from(this.players.entries());
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playerArray.length;
    } while (playerArray[this.currentPlayerIndex][1].folded);
  }

  /** Format cards for display */
  formatCards(cards, hidden = false) {
    if (hidden) return ['🂠', '🂠'];
    return cards.map(c => `${c.rank}${c.suit}`);
  }

  /** Reset for new game */
  reset() {
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.round = 'waiting';
    for (const [, player] of this.players) {
      player.hand = [];
      player.bet = 0;
      player.folded = false;
    }
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