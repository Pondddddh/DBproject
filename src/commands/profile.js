const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS } = require('../utils/constants');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your profile'),

  async execute(interaction) {
    const userData = await userMapper.authenticate(
      interaction.user.id,
      interaction.user.username
    );

    if (userData.user.role === 'banned') {
      return interaction.reply({
        content: '🚫 You are banned.',
        ephemeral: true
      });
    }

    const stats = await db.getUserStats(userData.dbUserId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${userData.user.username}'s Profile`)
      .addFields(
        { name: 'Tokens', value: userData.user.tokens.toString(), inline: true },
        { name: 'Role', value: userData.user.role, inline: true },
        { name: 'Games Played', value: (stats?.total_games || 0).toString(), inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  }
};