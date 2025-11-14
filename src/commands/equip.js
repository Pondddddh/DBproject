const { SlashCommandBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equip')
    .setDescription('Equip an item from your inventory')
    .addIntegerOption(option =>
      option.setName('item_id')
        .setDescription('The item ID to equip')
        .setRequired(true)
    ),

  async execute(interaction) {
    const itemId = interaction.options.getInteger('item_id');
    
    const userData = await userMapper.getOrCreateUser(
      interaction.user.id,
      interaction.user.username
    );

    const hasItem = await db.hasItem(userData.dbUserId, itemId);
    if (!hasItem) {
      return interaction.reply({
        content: '❌ You don\'t own this item!',
        ephemeral: true
      });
    }

    const item = await db.getItem(itemId);
    
    await interaction.reply({
      content: `✅ Equipped **${item.name}**!`,
      ephemeral: true
    });
  }
};
