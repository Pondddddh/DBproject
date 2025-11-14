const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View detailed statistics')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view stats for')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    const userData = await userMapper.getOrCreateUser(targetUser.id, targetUser.username);
    const stats = await db.getUserStats(userData.dbUserId);

    if (!stats) {
      return interaction.reply({
        content: 'No stats found for this user!',
        ephemeral: true
      });
    }

    const rank = await db.getUserRank(userData.dbUserId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.STATS} Stats for ${stats.username}`)
      .addFields(
        { name: `${EMOJIS.TOKENS} Tokens`, value: stats.tokens.toString(), inline: true },
        { name: `${EMOJIS.TROPHY} Total Wins`, value: (stats.total_wins || 0).toString(), inline: true },
        { name: '🎮 Total Games', value: (stats.total_games || 0).toString(), inline: true },
        { name: `${EMOJIS.RANK} Win Rate`, value: `${stats.win_rate || 0}%`, inline: true },
        { name: `${EMOJIS.LEADERBOARD} Rank`, value: `#${rank || 'Unranked'}`, inline: true },
        { name: `${EMOJIS.INVENTORY} Items Owned`, value: (stats.items_owned || 0).toString(), inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({ text: `Requested by ${interaction.user.username}` });

    await interaction.reply({ embeds: [embed] });
  }
};