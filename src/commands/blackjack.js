const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Blackjack = require('../games/Blackjack');
const gameManager = require('../managers/GameManager');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { COLORS, EMOJIS, GAMES } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Start a Blackjack game')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Amount to bet')
        .setMinValue(GAMES.BLACKJACK.MIN_BET)
        .setMaxValue(GAMES.BLACKJACK.MAX_BET)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (gameManager.hasActiveGame(interaction.channelId)) {
      return interaction.reply({
        content: '⚠️ A game is already active in this channel! Use `/endgame` to stop it.',
        ephemeral: true
      });
    }

    const bet = interaction.options.getInteger('bet') || GAMES.BLACKJACK.DEFAULT_BET;

    try {
      const userData = await userMapper.getOrCreateUser(
        interaction.user.id,
        interaction.user.username
      );

      if (userData.user.tokens < bet) {
        return interaction.reply({
          content: `${EMOJIS.TOKENS} Not enough tokens! You have ${userData.user.tokens} tokens, but bet is ${bet}.`,
          ephemeral: true
        });
      }

      await db.updateTokens(userData.dbUserId, -bet);

      const game = await db.getGameByName(GAMES.BLACKJACK.NAME);

      const blackjackGame = new Blackjack(interaction.channelId, interaction.user.id);
      blackjackGame.dbUserId = userData.dbUserId;
      blackjackGame.gameId = game.game_id;
      
      gameManager.startGame(interaction.channelId, blackjackGame, 'Blackjack');

      const state = blackjackGame.startGame(bet);

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${EMOJIS.CARDS} Blackjack`)
        .setDescription(`**Bet:** ${bet} ${EMOJIS.TOKENS} | **Balance:** ${userData.user.tokens - bet} ${EMOJIS.TOKENS}`)
        .addFields(
          {
            name: `Your Hand (${state.playerValue})`,
            value: blackjackGame.formatHand(state.playerHand),
            inline: true
          },
          {
            name: `Dealer's Hand`,
            value: blackjackGame.formatHand(state.dealerHand, true),
            inline: true
          }
        )
        .setFooter({ text: `${interaction.user.username}'s game` });

      if (state.gameOver) {
        let payout = 0;
        let result = state.result;

        if (state.result === 'blackjack') {
          payout = Math.floor(bet * GAMES.BLACKJACK.BLACKJACK_MULTIPLIER);
          embed.setDescription(`${EMOJIS.WIN} **BLACKJACK!** You win ${payout} ${EMOJIS.TOKENS}!`);
          embed.setColor(COLORS.SUCCESS);
        } else if (state.result === 'tie') {
          payout = bet;
          result = 'tie';
          embed.setDescription(`${EMOJIS.TIE} **Push!** Bet returned: ${bet} ${EMOJIS.TOKENS}`);
          embed.setColor(COLORS.WARNING);
        }

        await db.updateTokens(userData.dbUserId, payout);
        await db.recordGameResult(
          userData.dbUserId,
          game.game_id,
          result === 'blackjack' ? 'win' : result,
          bet,
          payout
        );

        const newUser = await db.getUser(userData.dbUserId);
        embed.addFields({ name: 'New Balance', value: `${newUser.tokens} ${EMOJIS.TOKENS}` });

        const newGameButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('bj_newgame')
            .setLabel('🔄 New Game')
            .setStyle(ButtonStyle.Primary)
        );

        gameManager.endGame(interaction.channelId);
        return interaction.reply({ embeds: [embed], components: [newGameButton] });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('bj_hit')
          .setLabel('👊 Hit')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('bj_stand')
          .setLabel('✋ Stand')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('bj_double')
          .setLabel('💰 Double Down')
          .setStyle(ButtonStyle.Success)
          .setDisabled(!state.canDoubleDown)
      );

      const endRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('endgame')
          .setLabel('❌ End Game')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row, endRow]
      });

    } catch (error) {
      console.error('Blackjack command error:', error);
      await interaction.reply({
        content: '❌ An error occurred while starting the game.',
        ephemeral: true
      });
    }
  }
};