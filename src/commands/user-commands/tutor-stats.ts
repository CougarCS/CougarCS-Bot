import { Command } from "../../interfaces/Command";
import { commandLog, sendError } from "../../utils/logs";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getContactId, getTutorId, getTutorLogs} from "../../utils/supabase";
import { createEmbeded } from "../../utils/embeded";
import { TutorLogQuery, TutorLogSelect } from "src/utils/types";
import { tutorStatsLengthOptions} from "../../utils/options";
import { tutorStatsFields } from "../../utils/embedFields";

const createTutorStatsEmbeds = (
  tutorLogs: TutorLogSelect[], 
  embeds: EmbedBuilder[],
  semesterCount: Number,
  semester: String,
  year: Number,
  detail: Boolean
): EmbedBuilder[] => {
  const suffix = semesterCount === 1 ? "" : "s";
  const startMessage = createEmbeded(`🔎 Found ${semesterCount} result${suffix}:`, " ")
  .setColor("Orange")
  const returnMessage = createEmbeded(`📊 ${semester} ${year}!`, " ")
  .setColor("Green")
  .addFields(...tutorStatsFields(tutorLogs, detail))
  embeds.push(startMessage);
  embeds.push(returnMessage);
  return embeds;
};

export const tutorstats: Command = {
  data : new SlashCommandBuilder()
      .setName("tutor-stats")
      .setDescription("Check your tutor stats!")
      .addBooleanOption((option) =>
          option
            .setName("detail")
            .setDescription("Indicate if you would like a week by week breakdown of your tutoring sessions!")
            .setRequired(true)
      )
      .addStringOption((option) =>
          option 
              .setName("semester")
              .setDescription("Type of semester!")
              .setRequired(false)
              .setChoices(...tutorStatsLengthOptions)
      )
      .addNumberOption((option) => 
          option
              .setName("year")
              .setDescription("Year of when you tutored!")
              .setRequired(false)
              .setMinValue(2023)
              .setMaxValue(new Date().getFullYear())
      ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const detail = interaction.options.get("detail", true).value as boolean;

    const semester = interaction.options.get("semester", false)?.value as string | null;

    const year = interaction.options.get("year", false)?.value as number | null;

    const discord_snowflake = interaction.user?.id as string;
    
    const contactIdResponse = await getContactId({discord_snowflake});

    const errorTitle = "❌ Tutor Stats Failed!";

    commandLog(interaction, "/tutor-stats", "Orange", [
      { name: "detail", value: `${detail}` },
      { name: "semester", value: `${semester}` },
      { name: "year", value: `${year}` },
    ]);

    if (contactIdResponse.error){
      await sendError(errorTitle, contactIdResponse.message, interaction);
      return;
    }

    const contact_id = contactIdResponse.data;

    const tutorIdResponse = await getTutorId({contact_id});
    
    if (tutorIdResponse.error){
      await sendError(errorTitle, tutorIdResponse.message, interaction);
      return;
    }
    
    const tutor_id = tutorIdResponse.data;

    const tutorLog : TutorLogQuery = {
      tutor_id : tutor_id
    };
    
    const tutorStatsEmbeds: EmbedBuilder[] = []; 
  
    let yearArray = [2023];
    for (let year = 2023; year < new Date().getFullYear(); year++) {
      yearArray.push(year++)
    };

    if (semester && year) {
      const tutorLogResponse = await getTutorLogs(tutorLog, semester, year);
      var results = 0;

      if (tutorLogResponse.error) {
        await sendError(errorTitle, tutorLogResponse.message, interaction);
        return;
      }

      results += 1
      const tutorLogs = tutorLogResponse.data;
   
      createTutorStatsEmbeds(tutorLogs, tutorStatsEmbeds, results, semester,year, detail)
    };

    if (semester && !year) {
      var errorCount = 0;
      for (let i = 0; i < yearArray.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semester, yearArray[i]);
        var results = 0;

        if (tutorLogResponse.error) {
          errorCount += 1;
          if (tutorLogResponse.message != "No tutor logs were found!" || errorCount == yearArray.length) {
            await sendError(errorTitle, tutorLogResponse.message, interaction);
          }
          return;
        }

        results += 1
        const tutorLogs = tutorLogResponse.data;

        createTutorStatsEmbeds(tutorLogs, tutorStatsEmbeds, results, semester,yearArray[i], detail)
      }
    };

    if (!semester && year) {
      const semesters = ["Spring", "Fall"];
      var errorCount = 0;
      for (let i = 0; i < semesters.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semesters[i], year)
        var results = 0;

        if (tutorLogResponse.error) {
          errorCount += 1;
          if (tutorLogResponse.message != "No tutor logs were found!" || errorCount == (semesters.length * yearArray.length)) {
            await sendError(errorTitle, tutorLogResponse.message, interaction);
          }
          return;
        }

        results += 1
        const tutorLogs = tutorLogResponse.data;

        createTutorStatsEmbeds(tutorLogs, tutorStatsEmbeds, results, semesters[i],year, detail)
        await interaction.editReply({ embeds: tutorStatsEmbeds });
      }
    };
    
    if (!semester && !year) {
      const semesters = ["Spring", "Fall"];
      var errorCount = 0;
      var results = 0;

      for (let i = 0; i < yearArray.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semesters[i], yearArray[i])

        if (tutorLogResponse.error) {
          errorCount += 1;
          if (tutorLogResponse.message != "No tutor logs were found!" || errorCount == (semesters.length * yearArray.length)) {
            await sendError(errorTitle, tutorLogResponse.message, interaction);
          }
          return;
        }

        results += 1
        const tutorLogs = tutorLogResponse.data;

        createTutorStatsEmbeds(tutorLogs, tutorStatsEmbeds, results, semesters[i],yearArray[i], detail)
      }
    };

    await interaction.editReply({ embeds: tutorStatsEmbeds });

    return;  
  },
};
