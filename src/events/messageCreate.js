const gameManager = require('../managers/GameManager');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const session = gameManager.getGame(message.channelId);
    if (!session) return;

    try {
      if (session.gameName === 'Game24') {
        const result = session.instance.checkAnswer(message.content);

        if (!result.valid) {
          await message.reply(`⚠️ ${result.message}`);
          return;
        }

        if (result.correct) {
          await message.reply(`${result.message}\n🎯 Attempts: ${result.attempts}`);
          // Optionally auto-generate new puzzle
          const numbers = session.instance.newPuzzle();
          await message.channel.send(
            `**New Puzzle!**\nNumbers: **${numbers.join(' • ')}**`
          );
        } else {
          await message.reply(result.message);
        }
      }

      // Add handlers for other games here (Blackjack, Poker, etc.)
      
    } catch (error) {
      console.error('Message handling error:', error);
      await message.reply('❌ An error occurred processing your message.');
    }
  }
};