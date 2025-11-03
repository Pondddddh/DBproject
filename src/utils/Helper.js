/**
 * TASK: Generate a random integer between two values.
 * PURPOSE: Used for shuffling cards, picking random players, or any random event.
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * TASK: Pause execution for a specific number of milliseconds.
 * PURPOSE: Used for pacing Discord messages (e.g. show card-by-card animation, delay before result).
 */
export function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * TASK: Calculate the sum of an array of numbers.
 * PURPOSE: Used to calculate total card values (like Blackjack score or pot totals in Poker).
 */
export function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * TASK: Deep copy an object or array.
 * PURPOSE: Used to safely duplicate game states or hands without mutating the original.
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * TASK: Shuffle an array in place.
 * PURPOSE: Used when you want to shuffle cards, player orders, or any random list.
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * TASK: Format time into readable string.
 * PURPOSE: Used to log timestamps or display session durations for game sessions.
 */
export function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour12: false });
}

/**
 * TASK: Check if two arrays contain the same elements (order-insensitive).
 * PURPOSE: Helpful for poker hand evaluation (e.g., checking matching sets or straights).
 */
export function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

/**
 * TASK: Generate a random unique ID string.
 * PURPOSE: Used for temporary session IDs, game IDs, or bet transaction IDs.
 */
export function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}
