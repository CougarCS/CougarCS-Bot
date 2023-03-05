import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getContact, insertMembership } from "../../utils/supabase";

export const grantmembership: Command = {
  data: new SlashCommandBuilder()
    .setName("grantmembership")
    .setDescription("Grant CougarCS membership to a user!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User who you would like to grant membership to!")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("length")
        .setDescription("Length of the membership!")
        .setChoices(
          {
            name: "Semester",
            value: "semester",
          },
          {
            name: "Year",
            value: "year",
          }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the membership!")
        .setChoices(
          {
            name: "Payment via Venmo",
            value: "mc-pv",
          },
          {
            name: "Payment via Cash",
            value: "mc-pc",
          },
          {
            name: "Payment via Square",
            value: "mc-psq",
          },
          {
            name: "Other Payment",
            value: "mc-p",
          },
          {
            name: "Involvment as Officer",
            value: "mc-io",
          },
          {
            name: "Involvment as Volunteer",
            value: "mc-iv",
          },
          {
            name: "Involvment as Tutor",
            value: "mc-it",
          },
          {
            name: "Involvment as CodeRED Officer",
            value: "mc-ico",
          },
          {
            name: "Involvment via WebDev",
            value: "mc-iw",
          },
          {
            name: "Other Involvment",
            value: "mc-i",
          }
        )
        .setRequired(true)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const discord_snowflake = interaction.options.get("user", true).user
      ?.id as string;
    const length = interaction.options.get("length", true).value as string;
    const reason_id = interaction.options.get("reason", true).value as string;

    commandLog(interaction, "/grantmembership", "Green", [
      {
        name: "user",
        value: discord_snowflake,
      },
      { name: "length", value: length },
      { name: "reason", value: reason_id },
    ]);

    const contactResponse = await getContact({ discord_snowflake });

    if (contactResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Grant Failed!",
        `${contactResponse.message}\nYou can create a new contact with \`/updatecontact\`!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const { contact_id } = contactResponse.data[0];

    const membershipResponse = await insertMembership(
      { contact_id },
      length,
      reason_id
    );

    if (membershipResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Grant Failed!",
        membershipResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const returnMessage = createEmbeded(
      "✅ Membership Granted!",
      `<@${discord_snowflake}> has successfully received a ${length} long membership!`,
      client
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
