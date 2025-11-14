const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const { COLORS, EMOJIS, LIMITS } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View top players')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of players to show')
        .setMinValue(5)
        .setMaxValue(LIMITS.LEADERBOARD_MAX)
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('sort')
        .setDescription('Sort by')
        .addChoices(
          { name: 'Tokens', value: 'tokens' },
          { name: 'Wins', value: 'wins' }
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    const sort = interaction.options.getString('sort') || 'tokens';

    const leaderboard = sort === 'wins' 
      ? await db.getLeaderboardByWins(limit)
      : await db.getLeaderboard(limit);

    if (leaderboard.length === 0) {
      return interaction.reply('No players found!');
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.LEADERBOARD} Leaderboard - Top ${leaderboard.length}`)
      .setDescription(
        leaderboard.map((player, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const sortValue = sort === 'wins' ? `${player.total_wins} wins` : `${player.tokens} ${EMOJIS.TOKENS}`;
          return `${medal} **${player.username}** - ${sortValue} (${player.win_rate}% WR)`;
        }).join('\n')
      )
      .setFooter({ text: `Sorted by ${sort}` });

    await interaction.reply({ embeds: [embed] });
  }
};
