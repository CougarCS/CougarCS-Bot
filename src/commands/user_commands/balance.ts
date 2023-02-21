import { SlashCommandBuilder, User } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { getBalance } from "../../utils/supabase";
import { log } from "../../utils/logs";

interface points {
  member_points: string;
}

export const balance: Command = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("See your CougarCoin Balance")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member who's CougarCoin balance you want to see")
        .setRequired(false)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const balanceMember = interaction.options.get("member", false);
    log(interaction, "/balance", "#FFD800", client, [
      { name: "member", value: `${balanceMember?.user}` },
    ]);
    const checkUserID = balanceMember ? balanceMember.user?.id : user.id;

    const balanceDetails = await getBalance(checkUserID);
    if (balanceDetails.status === "failure") {
      const errorMessage = createEmbeded(
        "❌ Error Fetching Balance!",
        balanceDetails.message,
        user,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Balance!",
      `${balanceMember ? `${balanceMember.user} has` : "You have"} ** ${
        balanceDetails.balance
      }** CougarCoin!`,
      user,
      client
    )
      .setColor("#FFD800")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
