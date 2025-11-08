const gameManager = require('../managers/GameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poker')
        .setDescription('Start a poker game session')
        .addIntegerOption(option => option
            .setName('small blind')
            .setDescription('Amount for small blind')
            .setMinValue(1)
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('big blind')
            .setDescription('Amount for big blind')
            .setMinValue(1)
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('starting chips')
            .setDescription('Starting chips for each player')
            .setMinValue(1)
            .setRequired(false)
        ),

    async execute(interaction) {
        if (gameManager.hasActiveGame(interaction.channelId)) {
            return interaction.reply(
                {
                    content: '⚠️ A game is already active in this channel! Use `/endgame` to stop it.',
                    ephemeral: true
                }
            )

            const game = new Poker(interaction.channelId);
            gameManager.startGame(interaction.channelId, game, 'Poker');
        }

    }


}