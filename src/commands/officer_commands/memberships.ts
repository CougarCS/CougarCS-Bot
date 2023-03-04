import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded, sendBulkEmbeds } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getMemberships } from "../../utils/supabase";

export const memberships: Command = {
  data: new SlashCommandBuilder()
    .setName("memberships")
    .setDescription("See a user's membership history!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription("UH issued PSID number. (7 digit id)")
        .setRequired(false)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("The email used to purchase a CougarCS membership.")
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName("discord")
        .setDescription("Discord user you wish to look for.")
        .setRequired(false)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const psid = interaction.options.get("psid", false);
    const email = interaction.options.get("email", false);
    const discord_snowflake = interaction.options.get("discord", false);

    commandLog(interaction, "/memberships", "Green", [
      { name: "psid", value: `${psid && psid.value}` },
      { name: "email", value: `${email && email.value}` },
      {
        name: "discord",
        value: `${discord_snowflake && discord_snowflake.user}`,
      },
    ]);

    if (!(psid || email || discord_snowflake)) {
      const returnMessage = createEmbeded(
        "❌ Search canceled!",
        "No search parameters specified.",
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const memberships = await getMemberships({
      uh_id: psid ? (psid.value as number) : undefined,
      email: email ? (email.value as string) : undefined,
      discord_snowflake: discord_snowflake
        ? (discord_snowflake.user?.id as string)
        : undefined,
    });

    if (memberships.status === "failure") {
      const returnMessage = createEmbeded(
        "Failure!",
        memberships.message,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const membershipArray = memberships.data.sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    const membershipEmbeds: EmbedBuilder[] = [];

    const infoEmbed = createEmbeded(
      `🔎 Found ${memberships.data.length} result${
        memberships.data.length === 1 ? "" : "s"
      }:`,
      " ",
      client
    )
      .setColor("Yellow")
      .setFooter(null)
      .setTimestamp(null);

    membershipEmbeds.push(infoEmbed);

    membershipArray.forEach((m) => {
      const startSeason =
        new Date(m.start_date).getMonth() < 6 ? "Spring" : "Fall";
      const startYear = new Date(m.start_date).getFullYear();

      const endSeason = new Date(m.end_date).getMonth() < 6 ? "Spring" : "Fall";
      const endYear = new Date(m.endYear).getFullYear();

      const term = startSeason === endSeason ? "Year" : "Semester";

      membershipEmbeds.push(
        createEmbeded(
          `${startSeason} ${startYear}: ${term} Long`,
          m.membership_code_id === "mc-ps"
            ? "Paid via Stripe"
            : m.membership_code_id === "mc-io"
            ? "Involvement as Officer"
            : "Other Payment/Involvement",
          client
        )
          .setColor("Green")
          .setFooter(null)
          .setTimestamp(null)
      );
    });
    await sendBulkEmbeds(interaction, membershipEmbeds);
    return;
  },
};
