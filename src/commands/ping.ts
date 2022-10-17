import { SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { createEmbeded } from "../utils/embeded";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Basic Discord bot command example"),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const returnMessage = createEmbeded(
      "Pong!",
      "Thanks for using /ping, " + user.username + "!",
      user,
      client
    )
      .setColor("Red")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
