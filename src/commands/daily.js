const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS, ECONOMY } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  async execute(interaction) {
    const userData = await userMapper.getOrCreateUser(
      interaction.user.id,
      interaction.user.username
    );

    const reward = ECONOMY.DAILY_REWARD_BASE;
    
    await db.updateTokens(userData.dbUserId, reward);
    
    const updatedUser = await db.getUser(userData.dbUserId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.DAILY} Daily Reward Claimed!`)
      .setDescription(
        `You received **${reward} ${EMOJIS.TOKENS}**!\n\n` +
        `**New Balance:** ${updatedUser.tokens} ${EMOJIS.TOKENS}\n\n` +
        `Come back tomorrow for more rewards!`
      )
      .setFooter({ text: 'Daily rewards reset every 24 hours' });

    await interaction.reply({ embeds: [embed] });
  }
};