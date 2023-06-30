import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { pingSB } from "../../utils/supabase";
import { commandLog, sendError } from "../../utils/logs";

export const supabaseping: Command = {
  data: new SlashCommandBuilder()
    .setName("supabaseping")
    .setDescription("Ping the Supabase Backend.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction) => {
    const startTime = new Date().getTime();

    await interaction.deferReply({ ephemeral: false });

    commandLog(interaction, "/supabaseping", "#3ECF8E", []);

    const errorTitle = "❌ Supabase Failed!";

    const ping = await pingSB();

    if (ping.error) {
      await sendError(
        errorTitle,
        `${JSON.stringify(ping.message, null, 1)}`,
        interaction
      );
      return;
    }

    const endTime = new Date().getTime();
    const repsonseTime = (endTime - startTime) / 1000;

    const returnMessage = createEmbeded(
      "<:supabase:867529336197480468> Supabase Pong!",
      `The Supabase instance responded with no errors!\nResponded in **${repsonseTime}** seconds!`
    ).setColor("#3ECF8E");

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
