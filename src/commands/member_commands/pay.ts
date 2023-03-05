import {
  Guild,
  GuildMember,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getBalance, insertTransaction, isMember } from "../../utils/supabase";

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

    const payUser = interaction.options.get("member", true).user?.id as string;
    const point_value = Math.floor(
      interaction.options.get("value", true).value as number
    );

    commandLog(interaction, "/pay", "Green", [
      { name: "member", value: `<@${payUser}>` },
      { name: "value", value: `${point_value}` },
    ]);

    await guild.members.fetch();
    const payMember = guild.members.cache.find(
      (m) => m.id === payUser
    ) as GuildMember;
    const pay_snowflake = payMember.id;

    const member = guild.members.cache.find(
      (m) => m.id === user.id
    ) as GuildMember;

    let memberRole = interaction.guild?.roles.cache.find(
      (r) => r.name === "Member"
    );

    if (!memberRole || !member.roles.cache.find((r) => r === memberRole)) {
      const errorMessage = createEmbeded(
        "❌ Payment Canceled!",
        `This command is available for members only!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const payMemberResponse = await isMember({
      discord_snowflake: pay_snowflake,
    });

    if (payMemberResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Payment Canceled!",
        payMemberResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const payActiveMember = payMemberResponse.data[0];

    if (!payActiveMember) {
      const errorMessage = createEmbeded(
        "❌ Payment Canceled!",
        `You may only send a payment to another member!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const discord_snowflake = user.id;

    const balanceResponse = await getBalance({ discord_snowflake });

    if (balanceResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Payment Canceled!",
        `There was an error verifying your balance!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const initialBalance = balanceResponse.data[0];

    if (initialBalance < point_value) {
      const errorMessage = createEmbeded(
        "❌ Payment Canceled!",
        `Your balance is too low!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const withdrawalResponse = await insertTransaction(
      { discord_snowflake },
      -point_value,
      "mpt-payment"
    );

    if (withdrawalResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Payment Canceled!",
        withdrawalResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const depositResponse = await insertTransaction(
      { discord_snowflake: pay_snowflake },
      point_value,
      "mpt-payment"
    );

    if (depositResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Payment Canceled!",
        depositResponse.message,
        client
      ).setColor("Red");
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
