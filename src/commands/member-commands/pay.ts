import { Guild, SlashCommandBuilder, User } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { getBalance, getRole, insertTransaction } from "../../utils/supabase";
import { TransactionInsert } from "../../utils/types";

export const pay: Command = {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Pay CougarCoin to another member!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member who you would like to pay!")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("value")
        .setDescription("How much CougarCoin you want to pay!")
        .setRequired(true)
        .setMinValue(1)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const payUser = interaction.options.get("member", true).user as User;
    const pay_snowflake = payUser.id;
    const point_value = Math.floor(
      interaction.options.get("value", true).value as number
    );

    commandLog(interaction, "/pay", "Green", [
      { name: "member", value: `<@${payUser}>` },
      { name: "value", value: `${point_value}` },
    ]);

    const errorTitle = "❌ Payment Canceled!";

    const payMember = await guild.members.fetch({ user: payUser });

    const member = await guild.members.fetch({ user });

    const roleResponse = await getRole("member", guild);

    if (roleResponse.error) {
      await sendError(errorTitle, "There is no member role!", interaction);
      return;
    }

    const memberRole = roleResponse.data;

    const hasMemberRole = member.roles.cache.find((r) => r === memberRole);

    if (!hasMemberRole) {
      await sendError(
        errorTitle,
        "This command is available for members only!",
        interaction
      );
      return;
    }

    const payMemberHasMemberRole = payMember.roles.cache.find(
      (r) => r === memberRole
    );

    if (!payMemberHasMemberRole) {
      await sendError(
        errorTitle,
        `You may only send a payment to another member!`,
        interaction
      );
      return;
    }

    const discord_snowflake = user.id;

    const balanceResponse = await getBalance({ discord_snowflake });

    if (balanceResponse.error) {
      await sendError(
        errorTitle,
        `There was an error verifying your balance!`,
        interaction
      );
      return;
    }

    const initialBalance = balanceResponse.data;

    if (initialBalance < point_value) {
      await sendError(errorTitle, `Your balance is too low!`, interaction);
      return;
    }

    const withdrawal: TransactionInsert = {
      queryData: { discord_snowflake },
      point_value: -point_value,
      reason_id: "mpt-payment",
    };

    const withdrawalResponse = await insertTransaction(withdrawal);

    if (withdrawalResponse.error) {
      await sendError(errorTitle, withdrawalResponse.message, interaction);
      return;
    }

    const deposit: TransactionInsert = {
      queryData: { discord_snowflake: pay_snowflake },
      point_value,
      reason_id: "mpt-payment",
    };

    const depositResponse = await insertTransaction(deposit);

    if (depositResponse.error) {
      await sendError(errorTitle, depositResponse.message, interaction);
      return;
    }

    const payBalanceResponse = await getBalance({
      discord_snowflake: pay_snowflake,
    });
    let payBalance = 0;

    if (!payBalanceResponse.error) {
      payBalance = payBalanceResponse.data;
    }

    const finalBalance = initialBalance - point_value;

    const returnMessage = createEmbed(
      "<a:CC:991512220909445150> CougarCoin Paid!",
      `You paid **${point_value}** CougarCoin to ${payMember.user}!`
    )
      .setColor("Green")
      .addFields(
        {
          name: "Your Balance",
          value: `${finalBalance}`,
        },
        {
          name: "Their Balance",
          value: `${payBalance}`,
        }
      );

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
