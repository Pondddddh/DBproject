const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS } = require('../utils/constants');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View user profile')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      
      console.log('Fetching profile for:', targetUser.username);
      
      const userData = await userMapper.getOrCreateUser(
        targetUser.id,
        targetUser.username
      );

      if (!userData || !userData.user) {
        return interaction.reply({
          content: '❌ Could not fetch user data. Please try again.',
          ephemeral: true
        });
      }

      const stats = await db.getUserStats(userData.dbUserId);
      const rank = await db.getUserRank(userData.dbUserId);
      const inventory = await db.getUserInventory(userData.dbUserId);

      const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle(`${EMOJIS.PROFILE} ${userData.user.username}'s Profile`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: `${EMOJIS.TOKENS} Tokens`, value: userData.user.tokens.toString(), inline: true },
          { name: `${EMOJIS.LEADERBOARD} Rank`, value: `#${rank || 'Unranked'}`, inline: true },
          { name: '👑 Role', value: userData.user.role, inline: true },
          { name: `${EMOJIS.TROPHY} Wins`, value: (stats?.total_wins || 0).toString(), inline: true },
          { name: '🎮 Games', value: (stats?.total_games || 0).toString(), inline: true },
          { name: `${EMOJIS.RANK} Win Rate`, value: `${stats?.win_rate || 0}%`, inline: true }
        );

      if (inventory && inventory.length > 0) {
        const itemNames = inventory.slice(0, 5).map(item => `• ${item.name}`).join('\n');
        const more = inventory.length > 5 ? `\n...and ${inventory.length - 5} more` : '';
        embed.addFields({
          name: `${EMOJIS.INVENTORY} Items (${inventory.length})`,
          value: itemNames + more,
          inline: false
        });
      }

      const createdDate = userData.user.created_at ? 
        new Date(userData.user.created_at).toLocaleDateString() : 'Unknown';
      
      embed.setFooter({ text: `Member since ${createdDate}` });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Profile command error:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching the profile.',
        ephemeral: true
      });
    }
  }
};