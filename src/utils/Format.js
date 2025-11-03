import { SUIT_EMOJIS } from './Constants.js';

export function formatCard(card) {
  const suitEmoji = SUIT_EMOJIS[card.suit] || card.suit;
  return `**${card.rank}${suitEmoji}**`;
}

export function formatHand(hand) {
  return hand.map(c => formatCard(c)).join(' ');
}

export function formatResult(result) {
  if (result === 'win') return '🟩 **You Win!**';
  if (result === 'lose') return '🟥 **You Lose!**';
  if (result === 'tie') return '🟨 **It’s a Tie!**';
  return '';
}
