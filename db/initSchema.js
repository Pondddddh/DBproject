const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config({ path: './.env' });

const sql = neon(process.env.DATABASE_URL);
const schema = fs.readFileSync('./db/schema.sql', 'utf8');

async function setup() {
  try {
    console.log("Connecting to:", process.env.DATABASE_URL);
    const { query } = sql;
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length);

    for (const statement of statements) {
      await sql.query(statement); 
    }
    console.log("All tables created successfully.");

    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public';`;
    console.log("Tables in database:", tables.map(t => t.table_name));
  } catch (err) {
    console.error("Error:", err);
  }
}

setup();
