import { SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { createEmbeded } from "../utils/embeded";

export const balance: Command = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("See Cougar Coin Balance"),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const returnMessage = createEmbeded(
      "Balance",
      "Your Cougar Coin balance is " + user.id + "!",
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
