import { Command } from "../../interfaces/Command";
import { sendError } from "../../utils/logs";
import { SlashCommandBuilder } from "discord.js";
import { getContactId, getTutorId, getTutorLogs} from "../../utils/supabase";
import { createEmbeded } from "../../utils/embeded";
import { TutorLogQuery } from "src/utils/types";

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
      )
      .addNumberOption((option) => 
          option
              .setName("year")
              .setDescription("Year of when you tutored!")
              .setRequired(false)
      ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const semester = interaction.options.get("semester", false)?.value as string | null ;

    const year = interaction.options.get("year", false)?.value as number | null;

    const discord_snowflake = interaction.user?.id as string;
    
    const contactIdResponse = await getContactId({discord_snowflake});

    const errorTitle = "❌ Tutor Stats Failed!";

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
        tutor_id : tutor_id,
    };
    
    if (semester && year) {
      const tutorLogResponse = await getTutorLogs(tutorLog, semester, year);

      if (tutorLogResponse.error) {
        await sendError(errorTitle, tutorLogResponse.message, interaction);
        return;
      }
    }

    if (semester && !year) {
      const years = [2023, new Date().getFullYear()];

      for (let i = 0; i < years.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semester, years[i]);

        if (tutorLogResponse.error) {
          await sendError(errorTitle, tutorLogResponse.message, interaction);
          return;
        }
      }
    }

    if (!semester && year) {
      const semesters = ["Spring", "Fall"];
      for (let i = 0; i < semesters.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semesters[i], year)

        if (tutorLogResponse.error) {
          await sendError(errorTitle, tutorLogResponse.message, interaction);
          return;
        }
      }
    }

    if (!semester && !year) {
      const semesters = ["Spring", "Fall"];

      // JS doesn't have range()
      const years = [2023, new Date().getFullYear()]

      for (let i = 0; i < years.length; i++) {
        const tutorLogResponse = await getTutorLogs(tutorLog, semesters[i], years[i])

        if (tutorLogResponse.error) {
          await sendError(errorTitle, tutorLogResponse.message, interaction);
          return;
        }
      }
    }

    const returnMessage = createEmbeded(
        "Tutor Stats Retrieved!",
        `test`
    ).setColor("Green");
      
    await interaction.editReply({ embeds: [returnMessage] });
    return;  
  },
};
