import {
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getContact, insertMembership } from "../../utils/supabase";
import {
  membershipCodeOptions,
  membershipLengthOptions,
} from "../../utils/options";

const sendError = async (
  errorMessage: string,
  interaction: CommandInteraction
) => {
  const errorEmbed = createEmbeded(
    "❌ Grant Failed!",
    errorMessage,
    interaction.client
  ).setColor("Red");
  await interaction.editReply({ embeds: [errorEmbed] });
};

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
        .setChoices(...membershipLengthOptions)
        .setRequired(true)
    )
    .addStringOption((option) => {
      membershipCodeOptions().then((types) => option.setChoices(...types));
      return option
        .setName("reason")
        .setDescription("Reason for the membership!")
        .setRequired(true);
    }),
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
      await sendError(
        `${contactResponse.message}\nYou can create a new contact with \`/updatecontact\`!`,
        interaction
      );
      return;
    }

    const { contact_id } = contactResponse.data[0];

    const membershipResponse = await insertMembership(
      { contact_id },
      length,
      reason_id
    );

    if (membershipResponse.error) {
      await sendError(membershipResponse.message, interaction);
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
