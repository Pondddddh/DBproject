const { Deck } = require('../utils/Deck');


class Poker {
  constructor(channelId, hostId) {
    this.channelId = channelId;
    this.hostId = hostId;
    this.players = new Map();
    this.deck = null;
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.currentPlayerIndex = 0;
    this.round = 'waiting';
    this.dealerPosition = 0;
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.playerOrder = [];
    this.lastRaiser = null;
  }
  addPlayer(userId, username, startingChips = 1000) {
    if (this.round !== 'waiting') {
      return { success: false, message: 'Game already started' };
    }

    if (this.players.size >= 8) {
      return { success: false, message: 'Game is full (max 8 players)' };
    }

    if (this.players.has(userId)) {
      return { success: false, message: 'Already in game' };
    }

    this.players.set(userId, {
      id: userId,
      username,
      chips: startingChips,
      hand: [],
      bet: 0,
      folded: false,
      position: this.players.size
    });

    this.playerOrder.push(userId);
    return { success: true, message: `${username} joined the game!` };
  }

  removePlayer(userId) {
    if (this.round !== 'waiting') {
      return { success: false, message: 'Cannot leave during game' };
    }

    this.players.delete(userId);
    this.playerOrder = this.playerOrder.filter(id => id !== userId);
    return { success: true };
  }

  startGame() {
    if (this.players.size < 2) {
      return { success: false, message: 'Need at least 2 players' };
    }

    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.round = 'preflop';

    this.players.forEach(player => {
      player.hand = [];
      player.bet = 0;
      player.folded = false;
    });

    this.postBlinds();

    this.dealHoleCards();

    this.currentPlayerIndex = (this.dealerPosition + 3) % this.playerOrder.length;

    return { success: true, message: 'Game started!' };
  }

  postBlinds() {
    const smallBlindIndex = (this.dealerPosition + 1) % this.playerOrder.length;
    const bigBlindIndex = (this.dealerPosition + 2) % this.playerOrder.length;

    const smallBlindPlayer = this.players.get(this.playerOrder[smallBlindIndex]);
    const bigBlindPlayer = this.players.get(this.playerOrder[bigBlindIndex]);

    smallBlindPlayer.chips -= this.smallBlind;
    smallBlindPlayer.bet = this.smallBlind;
    this.pot += this.smallBlind;

    bigBlindPlayer.chips -= this.bigBlind;
    bigBlindPlayer.bet = this.bigBlind;
    this.pot += this.bigBlind;

    this.currentBet = this.bigBlind;
  }

  dealHoleCards() {
    for (let i = 0; i < 2; i++) {
      this.playerOrder.forEach(playerId => {
        const player = this.players.get(playerId);
        if (!player.folded) {
          player.hand.push(this.deck.deal());
        }
      });
    }
  }

 
  dealCommunityCards() {
    if (this.round === 'flop') {
      this.communityCards.push(this.deck.deal());
      this.communityCards.push(this.deck.deal());
      this.communityCards.push(this.deck.deal());
    } else if (this.round === 'turn' || this.round === 'river') {
      this.communityCards.push(this.deck.deal());
    }
  }

 
  call(userId) {
    const player = this.players.get(userId);
    if (!player || player.folded) {
      return { success: false, message: 'Invalid action' };
    }

    const callAmount = this.currentBet - player.bet;
    const actualCall = Math.min(callAmount, player.chips);

    player.chips -= actualCall;
    player.bet += actualCall;
    this.pot += actualCall;

    this.nextPlayer();
    return { success: true, amount: actualCall };
  }


  raise(userId, amount) {
    const player = this.players.get(userId);
    if (!player || player.folded) {
      return { success: false, message: 'Invalid action' };
    }

    const callAmount = this.currentBet - player.bet;
    const totalAmount = callAmount + amount;

    if (player.chips < totalAmount) {
      return { success: false, message: 'Not enough chips' };
    }

    player.chips -= totalAmount;
    player.bet += totalAmount;
    this.pot += totalAmount;
    this.currentBet = player.bet;
    this.lastRaiser = userId;

    this.nextPlayer();
    return { success: true, amount: totalAmount };
  }

  fold(userId) {
    const player = this.players.get(userId);
    if (!player) {
      return { success: false, message: 'Invalid action' };
    }

    player.folded = true;

    const activePlayers = Array.from(this.players.values()).filter(p => !p.folded);
    if (activePlayers.length === 1) {
      this.round = 'showdown';
      return { success: true, winner: activePlayers[0].id, autoWin: true };
    }

    this.nextPlayer();
    return { success: true };
  }


  check(userId) {
    const player = this.players.get(userId);
    if (!player || player.folded) {
      return { success: false, message: 'Invalid action' };
    }

    if (player.bet < this.currentBet) {
      return { success: false, message: 'Must call or fold' };
    }

    this.nextPlayer();
    return { success: true };
  }

 
  nextRound() {
    this.players.forEach(player => {
      player.bet = 0;
    });
    this.currentBet = 0;
    this.lastRaiser = null;

    if (this.round === 'preflop') {
      this.round = 'flop';
      this.dealCommunityCards();
    } else if (this.round === 'flop') {
      this.round = 'turn';
      this.dealCommunityCards();
    } else if (this.round === 'turn') {
      this.round = 'river';
      this.dealCommunityCards();
    } else if (this.round === 'river') {
      this.round = 'showdown';
      return this.showdown();
    }

    this.currentPlayerIndex = (this.dealerPosition + 1) % this.playerOrder.length;
    this.skipFoldedPlayers();

    return { success: true, round: this.round };
  }

  nextPlayer() {
    let moved = false;
    let count = 0;

    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
      const currentPlayer = this.players.get(this.playerOrder[this.currentPlayerIndex]);
      count++;

      if (count > this.playerOrder.length) {
        // Everyone has acted, move to next round
        return this.nextRound();
      }

      if (!currentPlayer.folded) {
        // Check if betting round is complete
        const allBetsEqual = Array.from(this.players.values())
          .filter(p => !p.folded)
          .every(p => p.bet === this.currentBet || p.chips === 0);

        if (allBetsEqual && moved) {
          return this.nextRound();
        }
        moved = true;
        break;
      }
    } while (true);
  }

 
  skipFoldedPlayers() {
    let count = 0;
    while (this.players.get(this.playerOrder[this.currentPlayerIndex]).folded) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
      count++;
      if (count > this.playerOrder.length) break;
    }
  }

  showdown() {
    const activePlayers = Array.from(this.players.values()).filter(p => !p.folded);

    if (activePlayers.length === 0) {
      return { success: false, message: 'No active players' };
    }

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += this.pot;
      return {
        success: true,
        winner: winner.id,
        winnerName: winner.username,
        amount: this.pot,
        hand: null
      };
    }

    // Evaluate all hands
    const evaluations = activePlayers.map(player => ({
      player,
      evaluation: this.evaluateHand(player.hand, this.communityCards)
    }));

    // Sort by hand rank (higher is better)
    evaluations.sort((a, b) => {
      if (b.evaluation.rank !== a.evaluation.rank) {
        return b.evaluation.rank - a.evaluation.rank;
      }
      // Compare high cards if same rank
      for (let i = 0; i < 5; i++) {
        if (b.evaluation.values[i] !== a.evaluation.values[i]) {
          return b.evaluation.values[i] - a.evaluation.values[i];
        }
      }
      return 0;
    });

    const winner = evaluations[0].player;
    winner.chips += this.pot;

    return {
      success: true,
      winner: winner.id,
      winnerName: winner.username,
      amount: this.pot,
      hand: evaluations[0].evaluation
    };
  }

  /**
   * Evaluate poker hand
   */
  evaluateHand(playerCards, communityCards) {
    const allCards = [...playerCards, ...communityCards];
    const combinations = this.getCombinations(allCards, 5);

    let bestHand = { rank: -1, name: 'High Card', values: [] };

    for (const combo of combinations) {
      const evaluation = this.evaluateFiveCards(combo);
      if (evaluation.rank > bestHand.rank) {
        bestHand = evaluation;
      }
    }

    return bestHand;
  }

  /**
   * Get all 5-card combinations
   */
  getCombinations(cards, size) {
    if (size === 1) return cards.map(c => [c]);
    const combinations = [];
    for (let i = 0; i <= cards.length - size; i++) {
      const smaller = this.getCombinations(cards.slice(i + 1), size - 1);
      for (const combo of smaller) {
        combinations.push([cards[i], ...combo]);
      }
    }
    return combinations;
  }

  /**
   * Evaluate 5 cards
   */
  evaluateFiveCards(cards) {
    const ranks = cards.map(c => this.cardValue(c.rank)).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    const rankCounts = {};

    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = this.isStraightHelper(ranks);

    // Royal Flush
    if (isFlush && isStraight && ranks[0] === 14) {
      return { rank: 9, name: 'Royal Flush', values: ranks };
    }

    // Straight Flush
    if (isFlush && isStraight) {
      return { rank: 8, name: 'Straight Flush', values: ranks };
    }

    // Four of a Kind
    if (counts[0] === 4) {
      return { rank: 7, name: 'Four of a Kind', values: ranks };
    }

    // Full House
    if (counts[0] === 3 && counts[1] === 2) {
      return { rank: 6, name: 'Full House', values: ranks };
    }

    // Flush
    if (isFlush) {
      return { rank: 5, name: 'Flush', values: ranks };
    }

    // Straight
    if (isStraight) {
      return { rank: 4, name: 'Straight', values: ranks };
    }

    // Three of a Kind
    if (counts[0] === 3) {
      return { rank: 3, name: 'Three of a Kind', values: ranks };
    }

    // Two Pair
    if (counts[0] === 2 && counts[1] === 2) {
      return { rank: 2, name: 'Two Pair', values: ranks };
    }

    // One Pair
    if (counts[0] === 2) {
      return { rank: 1, name: 'One Pair', values: ranks };
    }

    // High Card
    return { rank: 0, name: 'High Card', values: ranks };
  }

  /**
   * Check if cards form a straight
   */
  isStraightHelper(sortedRanks) {
    for (let i = 0; i < sortedRanks.length - 1; i++) {
      if (sortedRanks[i] - sortedRanks[i + 1] !== 1) {
        // Check for A-2-3-4-5 straight
        if (i === 0 && sortedRanks[0] === 14 && sortedRanks[4] === 2) {
          return true;
        }
        return false;
      }
    }
    return true;
  }


  cardValue(rank) {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank);
  }

  getCurrentPlayer() {
    return this.players.get(this.playerOrder[this.currentPlayerIndex]);
  }

  getState() {
    return {
      players: Array.from(this.players.values()),
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      round: this.round,
      currentPlayer: this.getCurrentPlayer(),
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind
    };
  }


  formatCards(cards, hidden = false) {
    if (hidden) return '🎴 🎴';
    return cards.map(c => `**${c.rank}${c.suit}**`).join(' ');
  }

  reset() {
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.round = 'waiting';
    this.dealerPosition = (this.dealerPosition + 1) % this.playerOrder.length;
    
    this.players.forEach(player => {
      player.hand = [];
      player.bet = 0;
      player.folded = false;
    });
  }
}

module.exports = Poker;