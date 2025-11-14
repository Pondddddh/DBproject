const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Poker = require('../games/Poker');
const gameManager = require('../managers/GameManager');
const db = require('../../db/database');;
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS, GAMES } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poker')
    .setDescription('Start a Texas Hold\'em Poker game')
    .addIntegerOption(option =>
      option.setName('small_blind')
        .setDescription('Small blind amount')
        .setMinValue(5)
        .setMaxValue(100)
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('big_blind')
        .setDescription('Big blind amount')
        .setMinValue(10)
        .setMaxValue(200)
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('starting_chips')
        .setDescription('Starting chips per player')
        .setMinValue(100)
        .setMaxValue(10000)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (gameManager.hasActiveGame(interaction.channelId)) {
      return interaction.reply({
        content: '⚠️ A game is already active in this channel! Use `/endgame` to stop it.',
        ephemeral: true
      });
    }

    const smallBlind = interaction.options.getInteger('small_blind') || GAMES.POKER.DEFAULT_SMALL_BLIND;
    const bigBlind = interaction.options.getInteger('big_blind') || GAMES.POKER.DEFAULT_BIG_BLIND;
    const startingChips = interaction.options.getInteger('starting_chips') || GAMES.POKER.DEFAULT_STARTING_CHIPS;

    try {
      const hostData = await userMapper.getOrCreateUser(
        interaction.user.id,
        interaction.user.username
      );

      const pokerGame = new Poker(interaction.channelId, interaction.user.id);
      pokerGame.smallBlind = smallBlind;
      pokerGame.bigBlind = bigBlind;
      pokerGame.hostDbUserId = hostData.dbUserId;

      gameManager.startGame(interaction.channelId, pokerGame, 'Poker');

      pokerGame.addPlayer(interaction.user.id, interaction.user.username, startingChips);

      pokerGame.playerDbIds = new Map();
      pokerGame.playerDbIds.set(interaction.user.id, hostData.dbUserId);

      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('♠️ Texas Hold\'em Poker')
        .setDescription(
          `**Host:** ${interaction.user.username}\n` +
          `**Small Blind:** ${smallBlind} ${EMOJIS.TOKENS} | **Big Blind:** ${bigBlind} ${EMOJIS.TOKENS}\n` +
          `**Starting Chips:** ${startingChips}\n\n` +
          `**Players:** 1/${GAMES.POKER.MAX_PLAYERS}\n` +
          `• ${interaction.user.username}\n\n` +
          `Waiting for players to join...`
        )
        .setFooter({ text: `Need at least ${GAMES.POKER.MIN_PLAYERS} players to start` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('poker_join')
          .setLabel('🎲 Join Game')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('poker_start')
          .setLabel('▶️ Start Game')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('endgame')
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });

    } catch (error) {
      console.error('Poker command error:', error);
      await interaction.reply({
        content: '❌ An error occurred while starting the poker game.',
        ephemeral: true
      });
    }
  }
};