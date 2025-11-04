const gameManager = require('../managers/GameManager');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`Command ${interaction.commandName} not found`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const reply = {
          content: '❌ An error occurred while executing this command.',
          ephemeral: true
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    if (interaction.isButton()) {
      const session = gameManager.getGame(interaction.channelId);

      if (!session) {
        return interaction.reply({
          content: '❌ No active game found.',
          ephemeral: true
        });
      }

      try {
        if (interaction.customId === 'skip24' && session.gameName === 'Game24') {
          const numbers = session.instance.newPuzzle();
          await interaction.update({
            content: `🎮 **24 Game**\n\n🔄 New puzzle!\nNumbers: **${numbers.join(' • ')}**\n\nType your expression in chat.`,
            components: interaction.message.components
          });
        }

        // End game button
        if (interaction.customId === 'endgame') {
          const endedSession = gameManager.endGame(interaction.channelId);
          const duration = Math.floor((Date.now() - endedSession.startedAt) / 1000);
          await interaction.update({
            content: `✅ **${endedSession.gameName}** ended!\nDuration: ${duration} seconds`,
            components: []
          });
        }
      } catch (error) {
        console.error('Button interaction error:', error);
        await interaction.reply({
          content: '❌ An error occurred.',
          ephemeral: true
        });
      }
    }
  }
};