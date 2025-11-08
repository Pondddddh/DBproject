const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: './.env' });

const sql = neon(process.env.DATABASE_URL);

function getUserById(userId) {
  return sql`SELECT username FROM users WHERE id = ${userId}`.then(res => res[0]);
}

function createUser(userId, username, startingChips = 1000 ) {
  return sql`INSERT INTO users (id, username, tokens) VALUES (${userId}, ${username}, ${startingChips}) RETURNING *`.then(res => res[0]);
}

function updateUserTokens(userId, newTokenAmount) {
  return sql`UPDATE users SET tokens = ${newTokenAmount} WHERE id = ${userId} RETURNING *`.then(res => res[0]);
} 

module.exports = {
  getUserById,
  createUser,
  updateUserTokens
};