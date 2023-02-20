import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { createTransaction, getBalance } from "../../utils/supabase";

export const grant: Command = {
  data: new SlashCommandBuilder()
    .setName("grant")
    .setDescription("Grant CougarCoin to a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member you wish to grant CougarCoin to")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("value")
        .setDescription(
          "How much CougarCoin the user should receive (can be negative)"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Why this member is receiving this grant")
        .setChoices(
          {
            name: "General Grant",
            value: "mpt-general",
          },
          {
            name: "Attended Event",
            value: "mpt-event",
          },
          {
            name: "Points Spent",
            value: "mpt-purchase",
          }
        )
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const grantMember = interaction.options.get("member", true);
    const point_value = interaction.options.get("value", true).value as number;
    const reason_id = interaction.options.get("reason", false)?.value;

    if (grantMember.user?.id === user.id) {
      const returnMessage = createEmbeded(
        "❌ Grant Failed!",
        "You cannot grant CougarCoin to yourself!",
        user,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const pointGrant = await createTransaction(
      grantMember.user?.id,
      point_value,
      (reason_id || "mpt-general") as string
    );

    if (pointGrant.status === "failure") {
      const returnMessage = createEmbeded(
        "❌ Grant Failed!",
        pointGrant.message,
        user,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const { balance } = await getBalance(grantMember.user?.id);

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Granted!",
      `${grantMember.user} has received **${point_value}** CougarCoin!\n\nNew balance: **${balance}**`,
      user,
      client
    )
      .setColor("Green")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
