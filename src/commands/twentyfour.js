const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Game24 = require('../games/Game24');
const gameManager = require('../managers/GameManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('twentyfour')
    .setDescription('Start a 24 game puzzle'),

  async execute(interaction) {
    if (gameManager.hasActiveGame(interaction.channelId)) {
      return interaction.reply({
        content: '⚠️ A game is already active in this channel! Use `/endgame` to stop it.',
        ephemeral: true
      });
    }

    const game = new Game24(interaction.channelId);
    gameManager.startGame(interaction.channelId, game, 'Game24');

    const numbers = game.getNumbers();


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

    await interaction.reply({
      content: `🎮 **24 Game Started!**\n\nUse these numbers to make 24:\n**${numbers.join(' • ')}**\n\nType your expression in chat (e.g., \`(8*3)/(2-1)\`)`,
      components: [row]
    });
  }
};