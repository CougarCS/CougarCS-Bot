import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { log } from "../../utils/logs";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping the CougarCS Bot!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    log(interaction, "/ping", "Green", []);
    const returnMessage = createEmbeded(
      "🏓 Pong!",
      "Thank you for using the /ping command!",
      user,
      client
    )
      .setColor("Green")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
