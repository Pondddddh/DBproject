const { REST, Routes } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const commands = [];
    client.commands.forEach(command => {
      commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
      console.log('🔄 Refreshing slash commands...');

      if (process.env.GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
          { body: commands }
        );
        console.log(`✅ Registered ${commands.length} commands to guild ${process.env.GUILD_ID}`);
      } else {
        await rest.put(
          Routes.applicationCommands(client.user.id),
          { body: commands }
        );
        console.log(`✅ Registered ${commands.length} commands globally`);
      }
    } catch (error) {
      console.error('❌ Error registering commands:', error);
    }

    console.log('🤖 Bot is ready!');
  }
};