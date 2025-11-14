const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS, LIMITS } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View your recent game history')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of games to show')
        .setMinValue(5)
        .setMaxValue(LIMITS.HISTORY_MAX)
        .setRequired(false)
    ),

  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    
    const userData = await userMapper.getOrCreateUser(
      interaction.user.id,
      interaction.user.username
    );

    const history = await db.getUserGameHistory(userData.dbUserId, limit);

    if (history.length === 0) {
      return interaction.reply({
        content: 'No game history found!',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.GAME)
      .setTitle(`${EMOJIS.HISTORY} Game History`)
      .setDescription(
        history.map(game => {
          const emoji = game.result === 'win' ? '✅' : game.result === 'tie' ? '🤝' : '❌';
          const profit = game.win_amount - game.bet_amount;
          const profitStr = profit > 0 ? `+${profit}` : profit.toString();
          const date = new Date(game.timestamp).toLocaleDateString();
          return `${emoji} **${game.game_name}** - Bet: ${game.bet_amount}, Result: ${profitStr} ${EMOJIS.TOKENS} (${date})`;
        }).join('\n')
      )
      .setFooter({ text: `Last ${history.length} games` });

    await interaction.reply({ embeds: [embed] });
  }
};