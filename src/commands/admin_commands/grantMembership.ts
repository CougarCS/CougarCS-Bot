import {
  Guild,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import {
  getContact,
  getRole,
  isMember,
  insertMembership,
} from "../../utils/supabase";
import {
  membershipCodeOptions,
  membershipLengthOptions,
} from "../../utils/options";

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
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });

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

    const errorTitle = "❌ Grant Failed!";

    const contactResponse = await getContact({ discord_snowflake });

    if (contactResponse.error) {
      await sendError(
        errorTitle,
        `${contactResponse.message}\nYou can create a new contact with \`/createcontact\`!`,
        interaction
      );
      return;
    }

    const { contact_id } = contactResponse.data[0];

    const isMemberResponse = await isMember({ contact_id });

    if (!isMemberResponse.error && isMemberResponse.data[0]) {
      await sendError(
        errorTitle,
        `<@${discord_snowflake}> has already received a membership!`,
        interaction
      );
      return;
    }

    const membershipResponse = await insertMembership(
      { contact_id },
      length,
      reason_id
    );

    if (membershipResponse.error) {
      await sendError(errorTitle, membershipResponse.message, interaction);
      return;
    }

    const returnMessage = createEmbeded(
      "✅ Membership Granted!",
      `<@${discord_snowflake}> has successfully received a ${length} long membership!`
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });

    const guild = interaction.guild as Guild;

    const member = await guild.members.fetch({
      user: interaction.options.get("user", true).user as User,
    });

    const roleResponse = await getRole("member", guild);

    if (roleResponse.error) {
      await sendError(errorTitle, roleResponse.message, interaction);
      return;
    }

    const memberRole = roleResponse.data[0] as Role;

    await member.roles.add(memberRole);

    return;
  },
};
