import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { createTransaction, getBalance } from "../../utils/supabase";

export const pay: Command = {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Pay CougarCoin to another member!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member who you would like to pay")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("value")
        .setDescription("How much CougarCoin you want to pay")
        .setRequired(true)
        .setMinValue(1)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const payMember = interaction.options.get("member", true);
    const point_value = interaction.options.get("value", true);
    commandLog(interaction, "/pay", "Green", [
      { name: "member", value: `${payMember.user}` },
      { name: "value", value: `${point_value.value}` },
    ]);

    if (!payMember.user) return;

    if (
      !interaction.guild?.members.cache
        .find((m) => m.id === user.id)
        ?.roles.cache.find((r) => r.name === "Member")
    ) {
      const returnMessage = createEmbeded(
        "❌ Payment Canceled!",
        `This command is available for members only.`,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const yourBalanceCheck = await getBalance(user.id);
    if (yourBalanceCheck.status === "failure") {
      return;
    }
    if (yourBalanceCheck.balance < (point_value.value as number)) {
      const returnMessage = createEmbeded(
        "❌ Payment Canceled!",
        `Your balance is too low.`,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const subtract = await createTransaction(
      user.id,
      -(point_value.value as number),
      "mpt-payment"
    );

    if (subtract.status === "failure") {
      return;
    }

    const add = await createTransaction(
      payMember.user?.id,
      point_value.value as number,
      "mpt-payment"
    );

    if (add.status === "failure") {
      return;
    }

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Paid!",
      `You paid **${point_value.value}** CougarCoin to ${payMember.user}.`,
      client
    )
      .setColor("Green")
      .setFooter(null)
      .setTimestamp(null)
      .addFields(
        {
          name: "Your Balance",
          value: `${yourBalanceCheck.balance - (point_value.value as number)}`,
        },
        {
          name: "Their Balance",
          value: `${(await getBalance(payMember.user?.id)).balance}`,
        }
      );
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
