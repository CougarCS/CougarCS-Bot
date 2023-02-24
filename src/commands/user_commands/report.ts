import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import * as Logger from "../../utils/logs";

export const report: Command = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Send an official report to the CougarCS Officer Team")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("What is the type of command you are filing?")
        .setChoices(
          {
            name: "Member Issue",
            value: "Member Issue",
          },
          {
            name: "Event Issue",
            value: "Event Issue",
          },
          {
            name: "Administration Issue",
            value: "Administration Issue",
          },
          {
            name: "Other",
            value: "Other",
          }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Please describe your report in full detail")
        .setRequired(true)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const type = interaction.options.get("type", true).value as string;
    const message = interaction.options.get("message", true).value as string;
    Logger.log(interaction, "/report", "Red", [
      { name: "type", value: type },
      { name: "message", value: message },
    ]);

    const returnMessage = createEmbeded(
      "📢 Report Submitted!",
      "Your report has been submitted and is currently in review!",
      user,
      client
    )
      .setColor("Green")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [returnMessage] });
    Logger.report(interaction, type, message);
    return;
  },
};
