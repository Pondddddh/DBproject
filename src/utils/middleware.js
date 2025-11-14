const userMapper = require('../../db/usermapper');


async function requireAuth(interaction) {
  const userData = await userMapper.authenticate(
    interaction.user.id,
    interaction.user.username
  );

  if (userData.user.role === 'banned') {
    await interaction.reply({
      content: '🚫 You are banned from using this bot.',
      ephemeral: true
    });
    return null;
  }

  return userData;
}

async function requireRole(interaction, role) {
  const hasPermission = await userMapper.checkPermission(
    interaction.user.id,
    role
  );

  if (!hasPermission) {
    await interaction.reply({
      content: '❌ You don\'t have permission to use this command.',
      ephemeral: true
    });
    return false;
  }

  return true;
}

module.exports = { requireAuth, requireRole };