import { REST } from "@discordjs/rest";
import { Client, PresenceStatusData } from "discord.js";
import { Routes } from "discord-api-types/v10";
import { CommandList } from "../utils/_Commandlists";
import config from "../config/config.json";
import "dotenv/config";
import { log } from "../utils/logs";

export const onReady = async (client: Client) => {
  const rest = new REST({ version: "10" }).setToken(
    process.env.TOKEN as string
  );

  const commandData = CommandList.map((command) => command.data.toJSON());

  console.log("🔨 Started loading (/) commands.");
  await rest.put(
    Routes.applicationGuildCommands(
      client.user?.id || "missing id",
      process.env.GUILD_ID as string
    ),
    { body: commandData }
  );
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

  client.guilds.cache.forEach((g) => {
    log(
      "🔁 Bot Restarted",
      "The CougarCS bot has been restarted. All previous interactions are no longer connected.",
      "Blue",
      g
    );
  });
};
