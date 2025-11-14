const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your token balance'),

  async execute(interaction) {
    const userData = await userMapper.getOrCreateUser(
      interaction.user.id,
      interaction.user.username
    );

    const stats = await db.getUserStats(userData.dbUserId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.TOKENS} Your Balance`)
      .setDescription(`**${userData.user.tokens}** tokens`)
      .addFields(
        { name: 'Games Played', value: (stats?.total_games || 0).toString(), inline: true },
        { name: 'Games Won', value: (stats?.total_wins || 0).toString(), inline: true },
        { name: 'Win Rate', value: `${stats?.win_rate || 0}%`, inline: true }
      )
      .setFooter({ text: interaction.user.username })
      .setThumbnail(interaction.user.displayAvatarURL());

    await interaction.reply({ embeds: [embed] });
  }
};