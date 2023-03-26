import {
  Guild,
  GuildMember,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getBalance, insertTransaction, isMember } from "../../utils/supabase";
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
  run: async (interaction, client) => {
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

    const errorMessage = createEmbeded(
      "❌ Payment Canceled!",
      "There was an error performing this command!",
      client
    ).setColor("Red");

    const payMember = await guild.members.fetch({ user: payUser });

    const member = await guild.members.fetch({ user });

    await guild.roles.fetch();
    let memberRole = guild.roles.cache.find((r) => r.name === "Member");

    const hasMemberRole =
      memberRole && member.roles.cache.find((r) => r === memberRole);

    if (!hasMemberRole) {
      errorMessage.setDescription(
        "This command is available for members only!"
      );
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const payMemberResponse = await isMember({
      discord_snowflake: pay_snowflake,
    });

    if (payMemberResponse.error) {
      errorMessage.setDescription(payMemberResponse.message);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const payActiveMember = payMemberResponse.data[0];

    if (!payActiveMember) {
      errorMessage.setDescription(
        `You may only send a payment to another member!`
      );
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const discord_snowflake = user.id;

    const balanceResponse = await getBalance({ discord_snowflake });

    if (balanceResponse.error) {
      errorMessage.setDescription(`There was an error verifying your balance!`);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const initialBalance = balanceResponse.data[0];

    if (initialBalance < point_value) {
      errorMessage.setDescription(`Your balance is too low!`);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const withdrawal: TransactionInsert = {
      queryData: { discord_snowflake },
      point_value: -point_value,
      reason_id: "mpt-payment",
    };

    const withdrawalResponse = await insertTransaction(withdrawal);

    if (withdrawalResponse.error) {
      errorMessage.setDescription(withdrawalResponse.message);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const deposit: TransactionInsert = {
      queryData: { discord_snowflake: pay_snowflake },
      point_value,
      reason_id: "mpt-payment",
    };

    const depositResponse = await insertTransaction(deposit);

    if (depositResponse.error) {
      errorMessage.setDescription(depositResponse.message);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const payBalanceResponse = await getBalance({
      discord_snowflake: pay_snowflake,
    });
    let payBalance = 0;

    if (!payBalanceResponse.error) {
      payBalance = payBalanceResponse.data[0];
    }

    const finalBalance = initialBalance - point_value;

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Paid!",
      `You paid **${point_value}** CougarCoin to ${payMember.user}!`,
      client
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
