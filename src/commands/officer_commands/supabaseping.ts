import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { pingSB } from "../../utils/supabase";
import { commandLog } from "../../utils/logs";

export const supabaseping: Command = {
  data: new SlashCommandBuilder()
    .setName("supabaseping")
    .setDescription("Ping the Supabase Backend.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction, client) => {
    const startTime = new Date().getTime();

    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    commandLog(interaction, "/supabaseping", "#3ECF8E", []);

    const ping = await pingSB();

    if (ping.error) {
      const errorMessage = createEmbeded(
        "❌ Supabase Failed!",
        `${JSON.stringify(ping.message, null, 1)}`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const endTime = new Date().getTime();
    const repsonseTime = (endTime - startTime) / 1000;

    const returnMessage = createEmbeded(
      "<:supabase:867529336197480468> Supabase Pong!",
      `The Supabase instance responded with no errors!\nResponded in **${repsonseTime}** seconds!`,
      client
    ).setColor("#3ECF8E");

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
