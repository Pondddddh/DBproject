require("dotenv").config();
const { Client, GatewayIntentBits, Partials, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const math = require("mathjs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

let currentPuzzle = {};


function generateNumbers() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
}

function genNum() {
  let numbers;
  let count = 0;

  do {
    numbers = generateNumbers();
    count++;
    if (count > 1000) throw new Error("Stuck in infinite loop, check canMake24()");
  } while (!canMake24(numbers));

  return numbers;
}


function checkOne(expr) {
  return /^[0-9+\-*/() ]+$/.test(expr);
}

function checkTwo(expr, nums) {
  let numbers = expr.match(/\d+/g).map(Number);

  // sort both arrays numerically
  nums = [...nums].sort((a, b) => a - b);
  numbers = numbers.sort((a, b) => a - b);

  // compare
  if (nums.length !== numbers.length) return false;
  return nums.every((val, i) => val === numbers[i]);
}

function validateUserInput(input, nums) {
  if (!checkOne(input)) return false;  // invalid chars
  if (!checkTwo(input, nums)) return false;  // wrong numbers

  return true;
}


function canMake24(nums) {
  const ops = ['+', '-', '*', '/'];

  function is24(num) {
    return Math.abs(num - 24) < 1e-6;
  }

  function dfs(arr) {
    if (arr.length === 1) {
      return is24(arr[0]);
    }

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length; j++) {
        if (i === j) continue;

        const rest = [];
        for (let k = 0; k < arr.length; k++) {
          if (k !== i && k !== j) rest.push(arr[k]);
        }

        for (const op of ops) {
          if (op === '+') {
            if (dfs([...rest, arr[i] + arr[j]])) return true;
          } else if (op === '-') {
            if (dfs([...rest, arr[i] - arr[j]])) return true;
          } else if (op === '*') {
            if (dfs([...rest, arr[i] * arr[j]])) return true;
          } else if (op === '/') {
            if (arr[j] !== 0 && dfs([...rest, arr[i] / arr[j]])) return true;
          }
        }
      }
    }
    return false;
  }

  return dfs(nums);
}




client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("twentyfour")
      .setDescription("Start a 24 game puzzle")
  ].map(cmd => cmd.toJSON());

  await client.guilds.cache.get("1152179606435135509").commands.set(commands);

});


client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "twentyfour") {
      let numbers = genNum();
      currentPuzzle[interaction.channel.id] = numbers;



      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("skip24")
          .setLabel("🔄 New Puzzle")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        content: ` **24 Game** \nUse these numbers to make 24:\n**${numbers.join(", ")}**\n\nType your expression in chat (e.g., \`(8*3)/(2-1)\`).`,
        components: [row]
      });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === "skip24") {
      const numbers = genNum();
      currentPuzzle[interaction.channelId] = numbers;
      await interaction.update({
        content: ` **24 Game** \nNew puzzle!\nNumbers: **${numbers.join(", ")}**`,
        components: interaction.message.components
      });
    }
  }
});


client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!currentPuzzle[message.channelId]) return;

  const nums = currentPuzzle[message.channelId];
  try {
    const expr = message.content;
    const value = math.evaluate(expr);



    if (!validateUserInput(expr, nums)) {
      await message.reply(`Wrong! You may have entered the wrong format.`);
    } else if (Math.abs(value - 24) < 1e-6) {
      await message.reply(`✅ Correct! 🎉 You made 24 with: \`${expr}\``);
      delete currentPuzzle[message.channelId];
    } else {
      await message.reply(`❌ Wrong! Try again.`);
    }

  } catch (err) {
    await message.reply(`Wrong! You may have entered the wrong format.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
