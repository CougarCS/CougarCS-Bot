import { PermissionFlagsBits, SlashCommandBuilder, User } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { getBalance, insertTransaction } from "../../utils/supabase";
import { commandLog } from "../../utils/logs";

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

    const grantMember = interaction.options.get("member", true).user as User;
    const point_value = interaction.options.get("value", true).value as number;
    const reason_id = interaction.options.get("reason", false)?.value as
      | string
      | undefined;

    commandLog(interaction, "/grant", "Green", [
      { name: "member", value: `${grantMember}` },
      { name: "value", value: `${point_value}` },
      { name: "reason", value: `${reason_id}` },
    ]);

    const discord_snowflake = grantMember.id;

    if (discord_snowflake === user.id) {
      const returnMessage = createEmbeded(
        "❌ Grant Failed!",
        "You cannot grant CougarCoin to yourself!",
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const transactionResponse = await insertTransaction(
      { discord_snowflake },
      point_value,
      reason_id || "mpt-general"
    );

    if (transactionResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Grant Failed!",
        transactionResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const balanceResponse = await getBalance({ discord_snowflake });
    let balance = 0;

    if (!balanceResponse.error) {
      balance = balanceResponse.data[0];
    }

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Granted!",
      `${grantMember} has received **${point_value}** CougarCoin!\n\nNew balance: **${balance}**`,
      client
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
