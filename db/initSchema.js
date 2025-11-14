const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env' });

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  try {
    console.log("🔄 Connecting to database...");
    console.log("Database URL:", process.env.DATABASE_URL ? "Found" : "Missing");
  
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await sql.unsafe(statement);
        
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE\s+"?(\w+)"?/i)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE INDEX\s+"?(\w+)"?/i)?.[1];
          console.log(`✅ Created index: ${indexName}`);
        } else if (statement.includes('DROP TABLE')) {
          const tableName = statement.match(/DROP TABLE.*?"?(\w+)"?/i)?.[1];
          console.log(` Dropped table: ${tableName}`);
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
      }
    }


    console.log("\nVerifying database tables...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name
    `;
    
    console.log("\nTables in database:");
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    console.log("\nAdding default games...");
    
    const defaultGames = [
      { name: 'Blackjack', description: 'Classic card game - get as close to 21 as possible', min_bet: 10, max_bet: 1000 },
      { name: 'Poker', description: 'Texas Hold\'em Poker', min_bet: 20, max_bet: 500 },
      { name: 'Game24', description: 'Use four numbers to make 24', min_bet: 0, max_bet: 0 }
    ];
    
    for (const game of defaultGames) {
      try {
        await sql`
          INSERT INTO "Game" (name, description, min_bet, max_bet) 
          VALUES (${game.name}, ${game.description}, ${game.min_bet}, ${game.max_bet}) 
          ON CONFLICT (name) DO NOTHING
        `;
        console.log(`   ✅ Added game: ${game.name}`);
      } catch (err) {
        console.error(`   ❌ Error adding ${game.name}:`, err.message);
      }
    }
    
    console.log("\nDatabase setup completed successfully!");
    
  } catch (err) {
    console.error("\n❌ Setup failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

setup()
  .then(() => {
    console.log("\nSetup script finished.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);  });