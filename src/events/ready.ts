import { REST } from "@discordjs/rest";
import { Client, PresenceStatusData } from "discord.js";
import { Routes } from "discord-api-types/v10";
import { CommandList } from "../utils/_Commandlists";
import config from "../config/config.json";
import "dotenv/config";
import { log } from "../utils/logs";
import heartbeat from "../utils/heartbeat";

export const onReady = async (client: Client) => {
  const rest = new REST({ version: "10" }).setToken(
    process.env.TOKEN as string
  );

  const commandData = CommandList.map((command) => command.data.toJSON());

  console.log("🔨 Started loading (/) commands.");

  await client.guilds.fetch();
  const guilds = client.guilds.cache;

  for (const guildEntry of guilds) {
    const guild = guildEntry[1];
    await rest.put(
      Routes.applicationGuildCommands(
        client.user?.id || "missing id",
        guild.id
      ),
      { body: commandData }
    );
  }

  console.log("✅ Successfully loaded (/) commands.");

  client.user?.setPresence({
    activities: [
      {
        type: config.activityType,
        name: config.activityMessage,
      },
    ],
    status: config.status as PresenceStatusData,
  });
  console.log(
    `🗣️  Activity set to ${config.activityType} "${config.activityMessage}" with status ${config.status}`
  );

  console.log(`🤖 ${client.user?.tag} is online ⚡`);
  console.log("😺 Initialization complete");

  heartbeat();
  console.log("📈 Heartbeat started");

  client.guilds.cache.forEach((guild) => {
    console.log(guild.name);
    log(
      "🔁 Bot Restarted",
      "The CougarCS bot has been restarted. All previous interactions are no longer connected.",
      "Blue",
      guild
    );
  });

  process.on("uncaughtException", async (error) => {
    for (const [, guild] of client.guilds.cache) {
      await log(
        "❌ Bot Shut Down",
        `The CougarCS bot has been shut down due to an uncaught error. All previous interactions are no longer functional.`,
        "Red",
        guild
      );
      await log(" ", `${error.stack}`, "Red", guild);
    }
    process.exit(1);
  });
};
