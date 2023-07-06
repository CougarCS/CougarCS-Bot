import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { getBalance } from "../../utils/supabase";
import { commandLog, sendError } from "../../utils/logs";

export const balance: Command = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("See your CougarCoin Balance!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member who's CougarCoin balance you want to see!")
        .setRequired(false)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const balanceMember = interaction.options.get("member", false);

    commandLog(interaction, "/balance", "#FFD800", [
      { name: "member", value: `${balanceMember?.user}` },
    ]);

    const errorTitle = "❌ Balance Failed!";

    let discord_snowflake = user.id;

    if (balanceMember && balanceMember.user) {
      discord_snowflake = balanceMember.user.id;
    }

    const balanceResponse = await getBalance({ discord_snowflake });

    if (balanceResponse.error) {
      await sendError(errorTitle, balanceResponse.message, interaction);
      return;
    }

    const balance = balanceResponse.data;
    const prefix =
      discord_snowflake === user.id
        ? "You have"
        : `<@${discord_snowflake}> has`;

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Balance!",
      `${prefix} **${balance}** CougarCoin!`
    ).setColor("#FFD800");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
