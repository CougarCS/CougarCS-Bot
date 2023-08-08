import { Command } from "../../interfaces/Command";
import { commandLog, sendError } from "../../utils/logs";
import {  EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getContactId, getTutorId, getTutorLogs} from "../../utils/supabase";
import { createEmbeded, sendBulkEmbeds } from "../../utils/embeded";
import { TutorLogQuery, TutorLogSelect } from "src/utils/types";


// TUTOR EMBEDS
const formatTutorStats = async (
  log: TutorLogSelect
  ): Promise<EmbedBuilder> => {
    const tutored_user  = log.tutored_user;
    const hours = log.hours;
    const descriptionMessage = log.description ? `\ndescription: ${log.description}` : "";
    const timestamp = log.timestamp;
    const tutoringType = 'xxx' //todo 
    
    return createEmbeded(
      `Tutor Stats`,
      `tutored user: ${tutored_user},
      hours: ${hours}${descriptionMessage}
      timestamp: ${timestamp}
      tutoringType: `
      ).setColor("Green");
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
          // make it a dropdown
              .setName("semester")
              .setDescription("Type of semester!")
              .setRequired(false)
      )
      .addNumberOption((option) => 
          option
              .setName("year")
              .setDescription("Year of when you tutored!")
              .setRequired(false)
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
   
    if (semester && year) {
      const tutorLogResponse = await getTutorLogs(tutorLog, semester, year);
      console.log(tutorLogResponse)

      if (tutorLogResponse.error) {
        await sendError(errorTitle, tutorLogResponse.message, interaction);
        return;
      }

      const tutorLogs = tutorLogResponse.data;
   
      for (const log of tutorLogs) {
        tutorStatsEmbeds.push(await formatTutorStats(log));
      }
    };

    if (semester && !year) {
      const years = [2023, new Date().getFullYear()];

      for (let i = 0; i < years.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semester, years[i]);
        console.log(tutorLogResponse)

        if (tutorLogResponse.error) {
          await sendError(errorTitle, tutorLogResponse.message, interaction);
          return;
        }
        const tutorLogs = tutorLogResponse.data;

        for (const log of tutorLogs) {
          tutorStatsEmbeds.push(await formatTutorStats(log));
        }
      }
    };

    if (!semester && year) {
      const semesters = ["Spring", "Fall"];
      for (let i = 0; i < semesters.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semesters[i], year)
        console.log(tutorLogResponse)
        if (tutorLogResponse.error) {
          await sendError(errorTitle, tutorLogResponse.message, interaction);
          return;
        }

        const tutorLogs = tutorLogResponse.data;

        for (const log of tutorLogs) {
          tutorStatsEmbeds.push(await formatTutorStats(log));
        }
      }
    };

    if (!semester && !year) {
      const semesters = ["Spring", "Fall"];

      // JS doesn't have range()
      const years = [2023, new Date().getFullYear()]

      for (let i = 0; i < years.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semesters[i], years[i])
        console.log(tutorLogResponse)

        if (tutorLogResponse.error) {
          await sendError(errorTitle, tutorLogResponse.message, interaction);
          return;
        }

        const tutorLogs = tutorLogResponse.data;

        for (const log of tutorLogs) {
          tutorStatsEmbeds.push(await formatTutorStats(log));
        }
      }
    };

    await sendBulkEmbeds(interaction, tutorStatsEmbeds);
    return;  
  },
};
