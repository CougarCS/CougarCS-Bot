import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed } from "../../utils/embeded";
import { getTutorLeaderboard } from "../../utils/supabase";
import { commandLog, sendError } from "../../utils/logs";

const tutorleaderboardBody = (array: string[]): string => {
  let body = "";
  array.forEach((slot) => (body = `${body}${slot}\n`));
  return body;
};

export const tutorleaderboard: Command = {
  data: new SlashCommandBuilder()
    .setName("tutor-leaderboard")
    .setDescription("See the top tutor!")
    .addNumberOption((option) =>
      option
        .setName("number")
        .setDescription("Number of leaderboard spaces you want to see!")
        .setMaxValue(20)
        .setMinValue(1)
        .setRequired(false)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const number = interaction.options.get("number", false);
    commandLog(interaction, "/tutor-leaderboard", "Green", [
      {
        name: "number",
        value: `${number}`,
      },
    ]);

    const errorTitle = "❌ Tutor Leaderboard Canceled!";

    const maxSlots = (number?.value || 10) as number;
    const leaderboardResponse = await getTutorLeaderboard(maxSlots);

    if (leaderboardResponse.error) {
      await sendError(errorTitle, leaderboardResponse.message, interaction);
      return;
    }

    const leaderboardString = tutorleaderboardBody(leaderboardResponse.data);

    const returnMessage = createEmbed(
      "<:tutor:1151206705913417828> Tutor Leaderboard!",
      leaderboardString || "The leaderboard is empty!"
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
