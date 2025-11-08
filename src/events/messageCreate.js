const gameManager = require('../managers/GameManager');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('skip24')
              .setLabel('🔄 New Puzzle')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('endgame')
              .setLabel('❌ End Game')
              .setStyle(ButtonStyle.Danger)
          );
          const numbers = session.instance.newPuzzle();
          await message.channel.send({
            content : `**New Puzzle!**\nNumbers: **${numbers.join(' • ')}**`,
            components: [row]
          });
        } else {
          await message.reply(result.message);
        }
      }
      else if (session.gameName === 'Poker') {
        const result = session.instance.checkAnswer(message.content);

        if (!result.valid) {
          await message.reply(`⚠️ ${result.message}`);
          return;
        }

      }
      else if (session.gameName === 'Blackjack') {
        const result = session.instance.checkAnswer(message.content);

        if (!result.valid) {
          await message.reply(`⚠️ ${result.message}`);
          return;
        }

      }
    } catch (error) {
      console.error('Message handling error:', error);
      await message.reply('❌ An error occurred processing your message.');
    }
  }
};