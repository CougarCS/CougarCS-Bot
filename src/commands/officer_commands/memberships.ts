import {
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded, sendBulkEmbeds } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getMemberships } from "../../utils/supabase";

const formatMembership = (membership: any, client: Client): EmbedBuilder => {
  const startMonth = new Date(membership.start_date).getMonth();
  const startSeason = startMonth < 6 ? "Spring" : "Fall";
  const startYear = new Date(membership.start_date).getFullYear();
  const endMonth = new Date(membership.end_date).getMonth();
  const endSeason = endMonth < 6 ? "Spring" : "Fall";
  const term = startSeason === endSeason ? "Year" : "Semester";

  return createEmbeded(
    `${startSeason} ${startYear}: ${term} Long`,
    `${membership.membership_code_id}`,
    client
  ).setColor("Green");
};

export const memberships: Command = {
  data: new SlashCommandBuilder()
    .setName("memberships")
    .setDescription("See a user's membership history!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) =>
      option
        .setName("discord")
        .setDescription("Discord user you wish to look for!")
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription("UH issued PSID number (7 digit id)!")
        .setRequired(false)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("The email used to purchase a CougarCS membership!")
        .setRequired(false)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const psidOption = interaction.options.get("psid", false);
    const emailOption = interaction.options.get("email", false);
    const discordOption = interaction.options.get("discord", false);

    const uh_id = (psidOption && (psidOption.value as number)) || undefined;
    const email = (emailOption && (emailOption.value as string)) || undefined;
    const discord_snowflake =
      (discordOption && (discordOption.user?.id as string)) || undefined;

    commandLog(interaction, "/memberships", "Green", [
      { name: "psid", value: `${uh_id}` },
      { name: "email", value: `${email}` },
      {
        name: "discord",
        value: `<@${discord_snowflake}>`,
      },
    ]);

    const errorMessage = createEmbeded(
      "❌ Search Canceled!",
      "There was an error performing this command!",
      client
    ).setColor("Red");

    const noParams = !(uh_id || email || discord_snowflake);

    if (noParams) {
      errorMessage.setDescription("No search parameters specified!");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const membershipResponse = await getMemberships({
      uh_id,
      email,
      discord_snowflake,
    });

    if (membershipResponse.error) {
      errorMessage.setDescription(membershipResponse.message);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const memberships = membershipResponse.data;
    const membershipEmbeds: EmbedBuilder[] = [];
    const membershipCount = memberships.length;
    const suffix = membershipCount === 1 ? "" : "s";

    const infoMessage = createEmbeded(
      `🔎 Found ${membershipCount} result${suffix}:`,
      " ",
      client
    ).setColor("Yellow");

    membershipEmbeds.push(infoMessage);

    memberships.forEach((m) =>
      membershipEmbeds.push(formatMembership(m, client))
    );

    await sendBulkEmbeds(interaction, membershipEmbeds);
    return;
  },
};
