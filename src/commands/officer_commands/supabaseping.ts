import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { pingSB } from "../../utils/supabase";

export const supabaseping: Command = {
  data: new SlashCommandBuilder()
    .setName("supabaseping")
    .setDescription("Ping the Supabase Backend.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction, client) => {
    const startTime = new Date().getTime();
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    let ping = await pingSB();

    if (ping.error) {
      const returnMessage = createEmbeded(
        "❌ Supabase Failed!",
        `${JSON.stringify(ping, null, 1)}`,
        user,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }
    const endTime = new Date().getTime();
    const returnMessage = createEmbeded(
      "<:supabase:867529336197480468> Supabase Pong!",
      `The Supabase instance responded with no errors!\nResponded in **${
        (endTime - startTime) / 1000
      }** seconds!`,
      user,
      client
    )
      .setColor("#3ECF8E")
      .setFooter(null)
      .setTimestamp(null);

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
