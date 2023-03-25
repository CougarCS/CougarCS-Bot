import { Guild, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { cancelMembership } from "../../utils/supabase";

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
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const discord_snowflake = interaction.options.get("user", true).user
      ?.id as string;

    commandLog(interaction, "/cancelmembership", "Green", [
      { name: "user", value: `<@${discord_snowflake}>` },
    ]);

    const cancelResponse = await cancelMembership({ discord_snowflake });

    if (cancelResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Update Failed!",
        cancelResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const returnMessage = createEmbeded(
      "✅ Membership canceled!",
      `<@${discord_snowflake}>'s membership has been successfully canceled!`,
      client
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });

    const memberRole = guild.roles.cache.find((r) => r.name === "Member");

    if (!memberRole) return;

    const member = guild.members.cache.find((m) => m.id === discord_snowflake);

    if (!member) return;

    await member.roles.remove(memberRole);

    return;
  },
};
