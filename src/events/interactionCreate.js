const gameManager = require('../managers/GameManager');
const db = require('../../db/database');
const userMapper = require('../../db/usermapper');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, EMOJIS, GAMES } = require('../utils/constants');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`Command ${interaction.commandName} not found`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const reply = {
          content: '❌ An error occurred while executing this command.',
          ephemeral: true
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    if (interaction.isButton()) {
      const session = gameManager.getGame(interaction.channelId);

      if (!session && !interaction.customId.startsWith('bj_newgame')) {
        return interaction.reply({
          content: '❌ No active game found.',
          ephemeral: true
        });
      }

      try {
        // ===== GAME24 BUTTONS =====
        if (session && session.gameName === 'Game24') {
          if (interaction.customId === 'skip24') {
            const numbers = session.instance.newPuzzle();
            await interaction.update({
              content: `🎮 **24 Game**\n\n🔄 New puzzle!\nNumbers: **${numbers.join(' • ')}**\n\nType your expression in chat.`,
              components: interaction.message.components
            });
          }
        }

        // ===== BLACKJACK BUTTONS =====
        if (session && session.gameName === 'Blackjack') {
          const game = session.instance;

          if (game.userId !== interaction.user.id) {
            return interaction.reply({
              content: '❌ This is not your game!',
              ephemeral: true
            });
          }

          // HIT
          if (interaction.customId === 'bj_hit') {
            const result = game.hit();
            const user = await db.getUser(game.dbUserId);

            const embed = new EmbedBuilder()
              .setColor(result.busted ? COLORS.ERROR : COLORS.PRIMARY)
              .setTitle(`${EMOJIS.CARDS} Blackjack`)
              .addFields(
                {
                  name: `Your Hand (${result.handValue})`,
                  value: game.formatHand(game.playerHand),
                  inline: true
                },
                {
                  name: `Dealer's Hand`,
                  value: game.formatHand(game.dealerHand, !result.busted),
                  inline: true
                }
              );

            if (result.busted) {
              // Record loss
              await db.recordGameResult(game.dbUserId, game.gameId, 'lose', game.bet, 0);

              const updatedUser = await db.getUser(game.dbUserId);
              embed.setDescription(`💥 **BUST!** You lose ${game.bet} ${EMOJIS.TOKENS}\n**Balance:** ${updatedUser.tokens} ${EMOJIS.TOKENS}`);
              
              const newGameButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('bj_newgame')
                  .setLabel('🔄 New Game')
                  .setStyle(ButtonStyle.Primary)
              );

              gameManager.endGame(interaction.channelId);
              await interaction.update({ embeds: [embed], components: [newGameButton] });
            } else {
              embed.setDescription(`**Bet:** ${game.bet} ${EMOJIS.TOKENS} | **Balance:** ${user.tokens} ${EMOJIS.TOKENS}\n\nYou drew: ${result.card.rank}${result.card.suit}`);
              
              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('bj_hit')
                  .setLabel('👊 Hit')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId('bj_stand')
                  .setLabel('✋ Stand')
                  .setStyle(ButtonStyle.Secondary)
              );

              await interaction.update({ embeds: [embed], components: [row] });
            }
          }

          // STAND
          if (interaction.customId === 'bj_stand') {
            const result = game.stand();

            let payout = 0;
            let gameResult = 'lose';

            if (result.result === 'win') {
              payout = game.bet * GAMES.BLACKJACK.WIN_MULTIPLIER;
              gameResult = 'win';
            } else if (result.result === 'tie') {
              payout = game.bet;
              gameResult = 'tie';
            }

            // Update tokens and record result
            await db.updateTokens(game.dbUserId, payout);
            await db.recordGameResult(game.dbUserId, game.gameId, gameResult, game.bet, payout);

            const updatedUser = await db.getUser(game.dbUserId);

            const embed = new EmbedBuilder()
              .setTitle(`${EMOJIS.CARDS} Blackjack - Final Result`)
              .setDescription(`**New Balance:** ${updatedUser.tokens} ${EMOJIS.TOKENS}`)
              .addFields(
                {
                  name: `Your Hand (${result.playerValue})`,
                  value: game.formatHand(game.playerHand),
                  inline: true
                },
                {
                  name: `Dealer's Hand (${result.dealerValue})`,
                  value: game.formatHand(game.dealerHand),
                  inline: true
                }
              );

            if (result.result === 'win') {
              embed.setColor(COLORS.SUCCESS);
              embed.addFields({ name: 'Result', value: `${EMOJIS.WIN} YOU WIN! +${payout - game.bet} ${EMOJIS.TOKENS}` });
            } else if (result.result === 'lose') {
              embed.setColor(COLORS.ERROR);
              embed.addFields({ name: 'Result', value: `${EMOJIS.LOSE} YOU LOSE! -${game.bet} ${EMOJIS.TOKENS}` });
            } else {
              embed.setColor(COLORS.WARNING);
              embed.addFields({ name: 'Result', value: `${EMOJIS.TIE} PUSH! Bet returned` });
            }

            const newGameButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('bj_newgame')
                .setLabel('🔄 New Game')
                .setStyle(ButtonStyle.Primary)
            );

            gameManager.endGame(interaction.channelId);
            await interaction.update({ embeds: [embed], components: [newGameButton] });
          }

          // DOUBLE DOWN
          if (interaction.customId === 'bj_double') {
            const user = await db.getUser(game.dbUserId);

            if (user.tokens < game.bet) {
              return interaction.reply({
                content: `❌ Not enough tokens to double down! Need ${game.bet} more.`,
                ephemeral: true
              });
            }

            await db.updateTokens(game.dbUserId, -game.bet);

            const result = game.doubleDown();

            let payout = 0;
            let gameResult = 'lose';

            if (result.busted) {
              gameResult = 'lose';
            } else if (result.result === 'win') {
              payout = game.bet * GAMES.BLACKJACK.WIN_MULTIPLIER;
              gameResult = 'win';
            } else if (result.result === 'tie') {
              payout = game.bet;
              gameResult = 'tie';
            }

            await db.updateTokens(game.dbUserId, payout);
            await db.recordGameResult(game.dbUserId, game.gameId, gameResult, game.bet, payout);

            const updatedUser = await db.getUser(game.dbUserId);

            const embed = new EmbedBuilder()
              .setTitle(`${EMOJIS.CARDS} Blackjack - Double Down`)
              .setDescription(`**New Balance:** ${updatedUser.tokens} ${EMOJIS.TOKENS}`)
              .addFields(
                {
                  name: `Your Hand (${game.calculateHandValue(game.playerHand)})`,
                  value: game.formatHand(game.playerHand),
                  inline: true
                },
                {
                  name: `Dealer's Hand (${game.calculateHandValue(game.dealerHand)})`,
                  value: game.formatHand(game.dealerHand),
                  inline: true
                }
              );

            if (result.busted) {
              embed.setColor(COLORS.ERROR);
              embed.addFields({ name: 'Result', value: `💥 BUST! -${game.bet} ${EMOJIS.TOKENS}` });
            } else if (result.result === 'win') {
              embed.setColor(COLORS.SUCCESS);
              embed.addFields({ name: 'Result', value: `${EMOJIS.WIN} YOU WIN! +${payout - game.bet} ${EMOJIS.TOKENS}` });
            } else if (result.result === 'lose') {
              embed.setColor(COLORS.ERROR);
              embed.addFields({ name: 'Result', value: `${EMOJIS.LOSE} YOU LOSE! -${game.bet} ${EMOJIS.TOKENS}` });
            } else {
              embed.setColor(COLORS.WARNING);
              embed.addFields({ name: 'Result', value: `${EMOJIS.TIE} PUSH! Bet returned` });
            }

            const newGameButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('bj_newgame')
                .setLabel('🔄 New Game')
                .setStyle(ButtonStyle.Primary)
            );

            gameManager.endGame(interaction.channelId);
            await interaction.update({ embeds: [embed], components: [newGameButton] });
          }
        }

        // NEW GAME BUTTON (works without active session)
        if (interaction.customId === 'bj_newgame') {
          // Redirect to blackjack command
          return interaction.reply({
            content: 'Use `/blackjack [bet]` to start a new game!',
            ephemeral: true
          });
        }

        // End game button
        if (interaction.customId === 'endgame') {
          const endedSession = gameManager.endGame(interaction.channelId);
          const duration = Math.floor((Date.now() - endedSession.startedAt) / 1000);
          await interaction.update({
            content: `✅ **${endedSession.gameName}** ended!\nDuration: ${duration} seconds`,
            embeds: [],
            components: []
          });
        }
      } catch (error) {
        console.error('Button interaction error:', error);
        await interaction.reply({
          content: '❌ An error occurred.',
          ephemeral: true
        });
      }
    }
  }
};