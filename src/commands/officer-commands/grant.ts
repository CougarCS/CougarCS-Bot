import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { getBalance, insertTransaction } from "../../utils/supabase";
import { commandLog, sendError } from "../../utils/logs";
import { memberPointReasonOptions } from "../../utils/options";
import { TransactionInsert } from "../../utils/types";

export const grant: Command = {
  data: new SlashCommandBuilder()
    .setName("grant")
    .setDescription("Grant CougarCoin to a member!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member you wish to grant CougarCoin to!")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("value")
        .setDescription(
          "How much CougarCoin the user should receive (can be negative)!"
        )
        .setRequired(true)
    )
    .addStringOption((option) => {
      memberPointReasonOptions().then((reasons) =>
        option.setChoices(...reasons)
      );
      return option
        .setName("reason")
        .setDescription("Why this member is receiving this grant!")
        .setRequired(false);
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const transactionInfo: TransactionInsert = {
      queryData: {
        discord_snowflake: interaction.options.get("member", true).user
          ?.id as string,
      },
      point_value: interaction.options.get("value", true).value as number,
      reason_id:
        (interaction.options.get("reason", false)?.value as
          | string
          | undefined) || "mpt-general",
    };

    commandLog(interaction, "/grant", "Green", [
      {
        name: "member",
        value: `<@${transactionInfo.queryData.discord_snowflake}>`,
      },
      { name: "value", value: `${transactionInfo.point_value}` },
      { name: "reason", value: `${transactionInfo.reason_id}` },
    ]);

    const errorTitle = "❌ Grant Failed!";

    const { discord_snowflake } = transactionInfo.queryData;

    if (discord_snowflake === user.id) {
      await sendError(
        errorTitle,
        "You cannot grant CougarCoin to yourself!",
        interaction
      );
      return;
    }

    const transactionResponse = await insertTransaction(transactionInfo);

    if (transactionResponse.error) {
      await sendError(errorTitle, transactionResponse.message, interaction);
      return;
    }

    const balanceResponse = await getBalance({ discord_snowflake });
    let balance = 0;

    if (!balanceResponse.error) {
      balance = balanceResponse.data;
    }

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Granted!",
      `<@${discord_snowflake}> has received **${transactionInfo.point_value}** CougarCoin!\n\nNew balance: **${balance}**`
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
