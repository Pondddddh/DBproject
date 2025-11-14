const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse the item shop'),

  async execute(interaction) {
    const items = await db.getAllItems();

    if (items.length === 0) {
      return interaction.reply({
        content: '🏪 No items available in the shop!',
        ephemeral: true
      });
    }

    const userData = await userMapper.getOrCreateUser(
      interaction.user.id,
      interaction.user.username
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SHOP} Item Shop`)
      .setDescription(`**Your Tokens:** ${userData.user.tokens} ${EMOJIS.TOKENS}\n\nUse \`/buy [item_id]\` to purchase`)
      .setFooter({ text: `Showing ${items.length} items` });

    const itemList = items
      .map(item => `**[ID: ${item.item_id}]** ${item.name} - ${item.cost_tokens} ${EMOJIS.TOKENS}\n*${item.description}*`)
      .join('\n\n');

    embed.addFields({
      name: 'Available Items',
      value: itemList || 'No items',
      inline: false
    });

    await interaction.reply({ embeds: [embed] });
  }
};
