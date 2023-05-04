import {
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded, sendBulkEmbeds } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { getMembershipReason, getMemberships } from "../../utils/supabase";
import { UniqueContactQuery } from "../../utils/types";

const formatMembership = async (
  membership: any,
  client: Client
): Promise<EmbedBuilder> => {
  const startMonth = new Date(membership.start_date).getMonth();
  const startSeason = startMonth < 6 ? "Spring" : "Fall";
  const startYear = new Date(membership.start_date).getFullYear();
  const endMonth = new Date(membership.end_date).getMonth();
  const endDate = new Date(membership.end_date);
  const endDay = new Date(membership.end_date).getDate();
  const numSemesters = membership.semesters;
  const currentDate = new Date();
  const isCanceled = (endMonth !== 0 && endMonth !== 6) || endDay !== 1;

  let status = "Active";

  if (endDate < currentDate) status = "Expired";
  if (isCanceled) status = "Canceled";

  const membershipReasonResponse = await getMembershipReason(
    membership.membership_code_id
  );

  let reason = "General Membership";

  if (!membershipReasonResponse.error) {
    reason = membershipReasonResponse.data[0].message;
  }

  return createEmbeded(
    `${startSeason} ${startYear}`,
    `Number of Semesters: ${numSemesters}\nStatus: ${status}\n${reason}`,
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

    const query: UniqueContactQuery = {
      uh_id: interaction.options.get("psid", false)?.value as
        | number
        | undefined,
      email: interaction.options.get("email", false)?.value as
        | string
        | undefined,
      discord_snowflake: interaction.options.get("discord", false)?.user?.id as
        | string
        | undefined,
    };

    commandLog(interaction, "/memberships", "Green", [
      { name: "psid", value: `${query.uh_id}` },
      { name: "email", value: `${query.email}` },
      {
        name: "discord",
        value: `<@${query.discord_snowflake}>`,
      },
    ]);

    const errorTitle = "❌ Search Canceled!";

    const noParams = !(query.uh_id || query.email || query.discord_snowflake);

    if (noParams) {
      await sendError(
        errorTitle,
        "No search parameters specified!",
        interaction
      );
      return;
    }

    const membershipResponse = await getMemberships(query);

    if (membershipResponse.error) {
      await sendError(errorTitle, membershipResponse.message, interaction);
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

    for (const membership of memberships) {
      membershipEmbeds.push(await formatMembership(membership, client));
    }

    await sendBulkEmbeds(interaction, membershipEmbeds);
    return;
  },
};
