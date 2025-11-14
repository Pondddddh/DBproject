const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from the shop')
    .addIntegerOption(option =>
      option.setName('item_id')
        .setDescription('The item ID to purchase')
        .setRequired(true)
    ),

  async execute(interaction) {
    const itemId = interaction.options.getInteger('item_id');
    
    const userData = await userMapper.getOrCreateUser(
      interaction.user.id,
      interaction.user.username
    );

    const item = await db.getItem(itemId);
    if (!item) {
      return interaction.reply({
        content: '❌ Item not found!',
        ephemeral: true
      });
    }

    if (userData.user.tokens < item.cost_tokens) {
      return interaction.reply({
        content: `❌ Not enough tokens! You have ${userData.user.tokens} ${EMOJIS.TOKENS}, need ${item.cost_tokens} ${EMOJIS.TOKENS}`,
        ephemeral: true
      });
    }

    const hasItem = await db.hasItem(userData.dbUserId, itemId);
    if (hasItem) {
      return interaction.reply({
        content: '❌ You already own this item!',
        ephemeral: true
      });
    }

    await db.updateTokens(userData.dbUserId, -item.cost_tokens);
    await db.addItemToInventory(userData.dbUserId, itemId, 1);

    const updatedUser = await db.getUser(userData.dbUserId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Purchase Successful!')
      .setDescription(
        `**${item.name}** purchased!\n\n` +
        `Cost: ${item.cost_tokens} ${EMOJIS.TOKENS}\n` +
        `Remaining: ${updatedUser.tokens} ${EMOJIS.TOKENS}`
      )
      .addFields({
        name: 'Description',
        value: item.description || 'No description'
      })
      .setFooter({ text: 'Use /inventory to view your items' });

    await interaction.reply({ embeds: [embed] });
  }
};

