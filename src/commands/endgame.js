const { SlashCommandBuilder } = require('discord.js');
const gameManager = require('../managers/GameManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('endgame')
    .setDescription('End the current game session'),

  async execute(interaction) {
    if (!gameManager.hasActiveGame(interaction.channelId)) {
      return interaction.reply({
        content: '❌ No active game in this channel.',
        ephemeral: true
      });
    }

    const session = gameManager.endGame(interaction.channelId);
    const duration = Math.floor((Date.now() - session.startedAt) / 1000);

    await interaction.reply({
      content: `✅ **${session.gameName}** ended!\nDuration: ${duration} seconds`
    });
  }
};