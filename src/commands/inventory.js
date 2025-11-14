const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('View another user\'s inventory')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    const userData = await userMapper.getOrCreateUser(
      targetUser.id,
      targetUser.username
    );

    const inventory = await db.getUserInventory(userData.dbUserId);

    if (inventory.length === 0) {
      return interaction.reply({
        content: `${targetUser.username} has no items yet! Visit \`/shop\` to buy some.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.GAME)
      .setTitle(`${EMOJIS.INVENTORY} ${targetUser.username}'s Inventory`)
      .setDescription(`Total Items: ${inventory.length}`)
      .setThumbnail(targetUser.displayAvatarURL());

    const itemList = inventory
      .map(item => {
        const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
        return `**[ID: ${item.item_id}]** ${item.name}${qty}\n*${item.description}*`;
      })
      .join('\n\n');

    embed.addFields({
      name: 'Items',
      value: itemList,
      inline: false
    });

    embed.setFooter({ text: 'Use /equip [item_id] to equip items' });

    await interaction.reply({ embeds: [embed] });
  }
};