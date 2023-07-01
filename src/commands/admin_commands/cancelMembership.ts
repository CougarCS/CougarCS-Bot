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
import { cancelMembership, getRole } from "../../utils/supabase";

export const cancelmembership: Command = {
  data: new SlashCommandBuilder()
    .setName("cancelmembership")
    .setDescription("Cancel a user's CougarCS membership!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User who you would like to grant membership to!")
        .setRequired(true)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const guild = interaction.guild as Guild;

    const selectedUser = interaction.options.get("user", true).user as User;
    const discord_snowflake = selectedUser.id;

    commandLog(interaction, "/cancelmembership", "Green", [
      { name: "user", value: `<@${discord_snowflake}>` },
    ]);

    const errorTitle = "❌ Update Failed!";

    const cancelResponse = await cancelMembership({ discord_snowflake });

    if (cancelResponse.error) {
      await sendError(errorTitle, cancelResponse.message, interaction);
      return;
    }

    const returnMessage = createEmbeded(
      "✅ Membership canceled!",
      `<@${discord_snowflake}>'s membership has been successfully canceled!`
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });

    const roleResponse = await getRole("member", guild);

    if (roleResponse.error) {
      await sendError(errorTitle, roleResponse.message, interaction);
      return;
    }

    const memberRole = roleResponse.data[0] as Role;

    const member = await guild.members.fetch({ user: selectedUser });

    await member.roles.remove(memberRole);

    return;
  },
};
