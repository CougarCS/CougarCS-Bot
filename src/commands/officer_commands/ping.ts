import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping the CougarCS Bot!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    commandLog(interaction, "/ping", "Green", []);

    const returnMessage = createEmbeded(
      "🏓 Pong!",
      "Thank you for using the /ping command!",
      client
    ).setColor("Green");

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
