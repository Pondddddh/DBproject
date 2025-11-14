const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View bot commands and how to play')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Command category')
        .addChoices(
          { name: 'Games', value: 'games' },
          { name: 'Economy', value: 'economy' },
          { name: 'Social', value: 'social' },
          { name: 'Shop', value: 'shop' }
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category');

    if (!category) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('🎮 Game Bot Help')
        .setDescription(
          'Welcome to the Discord Game Bot! Play games, earn tokens, and compete on the leaderboard!\n\n' +
          'Use `/help [category]` to see specific commands.'
        )
        .addFields(
          {
            name: '🎲 Games',
            value: 
              '`/twentyfour` - Play 24 game\n' +
              '`/blackjack [bet]` - Play Blackjack\n' +
              '`/poker` - Start a Poker game\n' +
              '`/endgame` - End current game',
            inline: true
          },
          {
            name: '💰 Economy',
            value: 
              '`/balance` - Check your tokens\n' +
              '`/daily` - Claim daily reward\n' +
              '`/gift [user] [amount]` - Gift tokens',
            inline: true
          },
          {
            name: '🏪 Shop',
            value: 
              '`/shop [category]` - Browse items\n' +
              '`/buy [item_id]` - Purchase item\n' +
              '`/inventory [user]` - View items\n' +
              '`/equip [item_id]` - Equip item',
            inline: true
          },
          {
            name: '📊 Social',
            value: 
              '`/profile [user]` - View profile\n' +
              '`/stats [user]` - View statistics\n' +
              '`/leaderboard` - Top players\n' +
              '`/history` - Game history',
            inline: true
          }
        )
        .setFooter({ text: 'Use /help [category] for detailed info' });

      return interaction.reply({ embeds: [embed] });
    }

    let embed;

    switch (category) {
      case 'games':
        embed = new EmbedBuilder()
          .setColor(COLORS.GAME)
          .setTitle('🎲 Game Commands')
          .setDescription('Play various games to earn tokens!')
          .addFields(
            {
              name: '/twentyfour',
              value: 
                '**24 Game** - Make 24 using four numbers\n' +
                '• Use +, -, *, / operators\n' +
                '• Type your equation in chat\n' +
                '• Free to play!',
              inline: false
            },
            {
              name: '/blackjack [bet]',
              value: 
                '**Blackjack** - Get as close to 21 as possible\n' +
                '• Bet tokens to play\n' +
                '• Hit, Stand, or Double Down\n' +
                '• Blackjack pays 2.5x!',
              inline: false
            },
            {
              name: '/poker',
              value: 
                '**Texas Hold\'em Poker** - Best hand wins\n' +
                '• 2-8 players\n' +
                '• Betting rounds: Pre-flop, Flop, Turn, River\n' +
                '• Fold, Check, Call, or Raise',
              inline: false
            },
            {
              name: '/endgame',
              value: 'End the current game session in this channel',
              inline: false
            }
          );
        break;

      case 'economy':
        embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('💰 Economy Commands')
          .setDescription('Manage your tokens and earn rewards!')
          .addFields(
            {
              name: '/balance',
              value: 'Check your current token balance and stats',
              inline: false
            },
            {
              name: '/daily',
              value: 
                'Claim your daily reward!\n' +
                '• Base reward: 100 tokens\n' +
                '• Streak bonus: +10 per day\n' +
                '• Max reward: 500 tokens\n' +
                '• Come back every day!',
              inline: false
            },
            {
              name: '/gift [user] [amount]',
              value: 'Gift tokens to another player (min: 10, max: 10,000)',
              inline: false
            }
          );
        break;

      case 'shop':
        embed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('🏪 Shop Commands')
          .setDescription('Buy and manage items!')
          .addFields(
            {
              name: '/shop [category]',
              value: 
                'Browse available items\n' +
                '**Categories:**\n' +
                '• Badges - Show off your achievements\n' +
                '• Boosts - Temporary bonuses\n' +
                '• Cosmetics - Customize your profile\n' +
                '• Titles - Unlock special titles',
              inline: false
            },
            {
              name: '/buy [item_id]',
              value: 'Purchase an item from the shop',
              inline: false
            },
            {
              name: '/inventory [user]',
              value: 'View your or another user\'s items',
              inline: false
            },
            {
              name: '/equip [item_id]',
              value: 'Equip an item from your inventory',
              inline: false
            }
          );
        break;

      case 'social':
        embed = new EmbedBuilder()
          .setColor(COLORS.INFO)
          .setTitle('📊 Social Commands')
          .setDescription('View stats and compete with others!')
          .addFields(
            {
              name: '/profile [user]',
              value: 'View detailed user profile with stats and items',
              inline: false
            },
            {
              name: '/stats [user]',
              value: 'View comprehensive game statistics',
              inline: false
            },
            {
              name: '/leaderboard [limit]',
              value: 'View top players by tokens (default: 10 players)',
              inline: false
            },
            {
              name: '/history [limit]',
              value: 'View your recent game history (default: 10 games)',
              inline: false
            }
          );
        break;
    }

    await interaction.reply({ embeds: [embed] });
  }
};