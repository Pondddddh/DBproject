const math = require('mathjs');

class Game24 {
  constructor(channelId) {
    this.channelId = channelId;
    this.numbers = this.generateSolvableNumbers();
    this.solved = false;
    this.attempts = 0;
  }

  generateNumbers() {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
  }

  generateSolvableNumbers() {
    let numbers;
    let count = 0;
    do {
      numbers = this.generateNumbers();
      count++;
      if (count > 1000) throw new Error('Failed to generate solvable puzzle');
    } while (!this.canMake24(numbers));
    return numbers;
  }
   
  canMake24(nums) {
    const ops = ['+', '-', '*', '/'];

    function is24(num) {
      return Math.abs(num - 24) < 1e-6;
    }

    function dfs(arr) {
      if (arr.length === 1) return is24(arr[0]);

      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
          if (i === j) continue;

          const rest = [];
          for (let k = 0; k < arr.length; k++) {
            if (k !== i && k !== j) rest.push(arr[k]);
          }

          for (const op of ops) {
            let result;
            if (op === '+') result = arr[i] + arr[j];
            else if (op === '-') result = arr[i] - arr[j];
            else if (op === '*') result = arr[i] * arr[j];
            else if (op === '/' && arr[j] !== 0) result = arr[i] / arr[j];
            else continue;

            if (dfs([...rest, result])) return true;
          }
        }
      }
      return false;
    }

    return dfs(nums);
  }

  validateExpression(expr) {
    return /^[0-9+\-*/() ]+$/.test(expr);
  }

  usesCorrectNumbers(expr) {
    const usedNumbers = expr.match(/\d+/g)?.map(Number) || [];
    const sortedInput = [...usedNumbers].sort((a, b) => a - b);
    const sortedOriginal = [...this.numbers].sort((a, b) => a - b);

    return sortedInput.length === sortedOriginal.length &&
           sortedInput.every((val, i) => val === sortedOriginal[i]);
  }


  checkAnswer(expression) {
    this.attempts++;

    if (!this.validateExpression(expression)) {
      return { valid: false, message: 'Invalid characters in expression' };
    }

    if (!this.usesCorrectNumbers(expression)) {
      return { valid: false, message: 'Must use exactly the given numbers' };
    }

    try {
      const result = math.evaluate(expression);
      if (Math.abs(result - 24) < 1e-6) {
        this.solved = true;
        return { 
          valid: true, 
          correct: true, 
          message: `✅ Correct! You made 24 with: \`${expression}\``,
          attempts: this.attempts 
        };
      } else {
        return { 
          valid: true, 
          correct: false, 
          message: `❌ That equals ${result}, not 24. Try again!` 
        };
      }
    } catch (err) {
      return { valid: false, message: 'Invalid mathematical expression' };
    }
  }


  newPuzzle() {
    this.numbers = this.generateSolvableNumbers();
    this.solved = false;
    this.attempts = 0;
    return this.numbers;
  }


  getNumbers() {
    return [...this.numbers];
  }

 
  getState() {
    return {
      numbers: this.numbers,
      solved: this.solved,
      attempts: this.attempts
    };
  }
}

module.exports = Game24;