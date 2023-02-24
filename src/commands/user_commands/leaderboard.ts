import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { getLeaderboard } from "../../utils/supabase";
import { commandLog } from "../../utils/logs";

export const leaderboard: Command = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("See the CougarCoin leaderboard")
    .addNumberOption((option) =>
      option
        .setName("number")
        .setDescription("Number of leaderboard spaces you want to see")
        .setMaxValue(50)
        .setMinValue(1)
        .setRequired(false)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const number = interaction.options.get("number", false);
    commandLog(interaction, "/leaderboard", "Green", [
      {
        name: "number",
        value: `${number}`,
      },
    ]);

    const board = await getLeaderboard((number?.value || 10) as number);

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Leaderboard!",
      board,
      client
    )
      .setColor("Green")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
