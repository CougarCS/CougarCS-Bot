import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import * as Logger from "../../utils/logs";
import { reportOptions } from "../../utils/options";

export const report: Command = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Send an official report to the CougarCS Officer Team!")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("What is the type of report you are filing?")
        .setChoices(...reportOptions())
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Please describe your report in full detail!")
        .setRequired(true)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const type = interaction.options.get("type", true).value as string;
    const message = interaction.options.get("message", true).value as string;

    Logger.commandLog(interaction, "/report", "Red", [
      { name: "type", value: type },
      { name: "message", value: message },
    ]);

    const returnMessage = createEmbeded(
      "📢 Report Submitted!",
      "Your report has been submitted and is currently in review!"
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });

    Logger.report(interaction, type, message);

    return;
  },
};
