import { Client, Interaction } from "discord.js";
import { CommandList } from "../utils/_Commandlists";

export const onInteraction = async (
  interaction: Interaction,
  client: Client
) => {
  if (interaction.isChatInputCommand()) {
    for (const Command of CommandList) {
      if (interaction.commandName == Command.data.name) {
        await Command.run(interaction, client);
        break;
      }
    }
  }
};
