import { Command } from "../../interfaces/Command";
import { commandLog, sendError } from "../../utils/logs";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getContactId, getTutorId, getTutorLogs } from "../../utils/supabase";
import { createEmbed, sendBulkEmbeds } from "../../utils/embeded";
import { TutorLogQuery, TutorLogSelect } from "src/utils/types";
import { tutorStatsLengthOptions } from "../../utils/options";
import { tutorStatsFields } from "../../utils/embedFields";

const createTutorStatsEmbeds = (
  tutorLogs: TutorLogSelect[],
  detailed: boolean,
  discord_snowflake: string
): EmbedBuilder[] => {
  const groupedLogs: TutorLogSelect[][] = [];
  let curSemester = "";

  for (const tutorLog of tutorLogs) {
    const { timestamp } = tutorLog;
    const date = new Date(timestamp);
    const thisSemester = date.getMonth() < 6 ? "Spring" : "Fall";

    if (curSemester !== thisSemester) {
      curSemester = thisSemester;
      groupedLogs.push([]);
    }

    const ind = groupedLogs.length - 1;
    groupedLogs[ind].push(tutorLog);
  }

  const embeds: EmbedBuilder[] = [];

  const suffix = groupedLogs.length === 1 ? "" : "s";

  const startMessage = createEmbed(
    `🔎 Found ${groupedLogs.length} result${suffix}!`,
    `Tutor stats for <@${discord_snowflake}>`
  ).setColor("Yellow");

  embeds.push(startMessage);

  const logEmbeds = groupedLogs.map((logGroup) => {
    const firstTimestamp = logGroup[0].timestamp;
    const firstDate = new Date(firstTimestamp);
    const semester = firstDate.getMonth() < 6 ? "Spring" : "Fall";
    const year = firstDate.getFullYear();

    return createEmbed(`📊 ${semester} ${year}!`, " ")
      .setColor("Green")
      .addFields(...tutorStatsFields(logGroup, detailed));
  });

  embeds.push(...logEmbeds);

  return embeds;
};

export const tutorstats: Command = {
  data: new SlashCommandBuilder()
    .setName("tutor-stats")
    .setDescription("Check your tutor stats!")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Whose tutor stats you would like to view!")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("detailed")
        .setDescription(
          "Indicate if you would like a week by week detailed breakdown of your tutoring sessions!"
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("semester")
        .setDescription("Type of semester!")
        .setRequired(false)
        .setChoices(...tutorStatsLengthOptions)
    )
    .addIntegerOption((option) =>
      option
        .setName("year")
        .setDescription("Year of when you tutored!")
        .setRequired(false)
        .setMinValue(2023)
        .setMaxValue(new Date().getFullYear())
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const discord_snowflake =
      interaction.options.get("user", false)?.user?.id ?? user.id;
    const detailed = !!interaction.options.get("detailed", false)?.value;
    const semester = interaction.options.get("semester", false)?.value as
      | "Fall"
      | "Spring"
      | undefined;
    const year = interaction.options.get("year", false)?.value as
      | number
      | undefined;

    commandLog(interaction, "/tutor-stats", "Orange", [
      { name: "detail", value: `${detailed}` },
      { name: "semester", value: `${semester}` },
      { name: "year", value: `${year}` },
    ]);

    const errorTitle = "❌ Tutor Stats Failed!";

    const contactIdResponse = await getContactId({ discord_snowflake });

    if (contactIdResponse.error) {
      await sendError(errorTitle, contactIdResponse.message, interaction);
      return;
    }

    const contact_id = contactIdResponse.data;

    const tutorIdResponse = await getTutorId({ contact_id });

    if (tutorIdResponse.error) {
      await sendError(errorTitle, tutorIdResponse.message, interaction);
      return;
    }

    const tutor_id = tutorIdResponse.data;

    const tutorLogQuery: TutorLogQuery = {
      tutor_id,
    };

    const tutorLogResponse = await getTutorLogs(
      tutorLogQuery,
      ...getDateRanges({ semester, year })
    );

    if (tutorLogResponse.error) {
      sendError(errorTitle, tutorLogResponse.message, interaction);
      return;
    }

    const tutorLogs = tutorLogResponse.data;

    const tutorStatsEmbeds: EmbedBuilder[] = createTutorStatsEmbeds(
      tutorLogs,
      detailed,
      discord_snowflake
    );

    await sendBulkEmbeds(interaction, tutorStatsEmbeds);
    return;
  },
};

const getDateRanges = (input: {
  semester?: "Fall" | "Spring";
  year?: number;
}): [Date, Date] => {
  const { semester, year } = input;

  const now = new Date();
  const start_date = new Date();
  const end_date = new Date();

  if (semester) {
    const isSpring = semester === "Spring";
    const viewYear = year ?? now.getFullYear();
    start_date.setFullYear(viewYear, isSpring ? 0 : 6, 1);
    end_date.setFullYear(
      isSpring ? viewYear : viewYear + 1,
      isSpring ? 6 : 0,
      1
    );
    return [start_date, end_date];
  }

  if (year) {
    start_date.setFullYear(year, 0, 1);
    end_date.setFullYear(year + 1, 0, 1);
    return [start_date, end_date];
  }

  start_date.setFullYear(2023, 0, 1);
  end_date.setFullYear(9999, 0, 1);
  return [start_date, end_date];
};
