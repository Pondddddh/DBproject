
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}


function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour12: false });
}


function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

/**
 * Generate unique ID
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

module.exports = {
  randomInt,
  sleep,
  sum,
  clone,
  shuffleArray,
  formatTime,
  arraysEqual,
  generateId
};