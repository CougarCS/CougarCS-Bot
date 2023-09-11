import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed } from "../../utils/embeded";
import { getLeaderboard } from "../../utils/supabase";
import { commandLog, sendError } from "../../utils/logs";

const leaderboardBody = (array: string[]): string => {
  let body = "";
  array.forEach((slot) => (body = `${body}${slot}\n`));
  return body;
};

export const leaderboard: Command = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("See the CougarCoin leaderboard!")
    .addNumberOption((option) =>
      option
        .setName("number")
        .setDescription("Number of leaderboard spaces you want to see!")
        .setMaxValue(50)
        .setMinValue(1)
        .setRequired(false)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const number = interaction.options.get("number", false);
    commandLog(interaction, "/leaderboard", "Green", [
      {
        name: "number",
        value: `${number}`,
      },
    ]);

    const errorTitle = "❌ Leaderboard Canceled!";

    const maxSlots = (number?.value || 10) as number;
    const leaderboardResponse = await getLeaderboard(maxSlots);

    if (leaderboardResponse.error) {
      await sendError(errorTitle, leaderboardResponse.message, interaction);
      return;
    }

    const leaderboardString = leaderboardBody(leaderboardResponse.data);

    const returnMessage = createEmbed(
      "<a:CC:991512220909445150> CougarCoin Leaderboard!",
      leaderboardString || "The leaderboard is empty!"
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
