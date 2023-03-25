import { Guild, SlashCommandBuilder, User } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { getBalance } from "../../utils/supabase";
import { commandLog } from "../../utils/logs";

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
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const balanceMember = interaction.options.get("member", false);

    commandLog(interaction, "/balance", "#FFD800", [
      { name: "member", value: `${balanceMember?.user}` },
    ]);

    let discord_snowflake = user.id;

    if (balanceMember && balanceMember.user) {
      discord_snowflake = balanceMember.user.id;
    }

    const balanceResponse = await getBalance({ discord_snowflake });

    if (balanceResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Balance Failed!",
        balanceResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const balance = balanceResponse.data[0];
    const prefix =
      discord_snowflake === user.id
        ? "You have"
        : `<@${discord_snowflake}> has`;

    const returnMessage = createEmbeded(
      "<a:CC:991512220909445150> CougarCoin Balance!",
      `${prefix} **${balance}** CougarCoin!`,
      client
    ).setColor("#FFD800");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
