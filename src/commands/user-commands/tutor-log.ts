
import { Command } from "../../interfaces/Command";
import { commandLog, sendError } from "../../utils/logs";
import { SlashCommandBuilder } from "discord.js";
import { reportOptions } from "../../utils/options";
import { TutorLogInsert } from "../../utils/types";
import { insertTutorLog } from "../../utils/supabase";


export const tutorlog: Command = {

  
    data : new  SlashCommandBuilder()
      .setName("tutor-log")
      .setDescription("Log your tutor hours")
      .addStringOption((option) =>
      option
      .setName("tutoring-type")
      .setDescription("Online or in-person?")
      .addChoices(
        {name: 'In Person', value: 't-ip'},
        {name: 'Online Voice Chat', value: 't-ov'},
        {name: 'Online Text Chat', value: 't-ot'}
        )
      .setRequired(true)
  )
  .addStringOption((option) =>
  option
      .setName("tutored-user")
      .setDescription("Name of the student you tutored")
      .setRequired(true)
  )
    .addNumberOption((option) =>
      option
        .setName("hours")
        .setDescription("How many hours did you tutor?")
        .setMaxValue(5)
        .setMinValue(1)
        .setRequired(false)
    )
    .addStringOption((option) =>
    option
    .setName("description")
    .setDescription("Optional description of the tutoring session")
    .setChoices(...reportOptions())
    .setRequired(false)
    )
  ,
    run: async (interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const discord_snowflake = interaction.user.id;

        const create: TutorLogInsert = {
            hours: interaction.options.get("hours", true).value as number,
            tutoring_type_id: interaction.options.get("tutoring-type", true).value as string,
            tutored_user: interaction.options.get("tutored-user", true).value as string,
            description: interaction.options.get("description", true).value as string,
            // tutor_log_id?: string;
            // tutor_id?: string;
            // hours?: number;
            // tutoring_type_id : string ;
            // tutored_user?: string;
            // description?: string | null | undefined;
      //   }

      commandLog(interaction, "/tutor-log", "Orange", [
        // {name: "tutor-log", value: `${create.hours}`} 
      ]);
        
      const errorTitle = "❌ Insert Failed!";

      const tutorLogResponse = await insertTutorLog (create);
      
      if (tutorLogResponse.error) {
        await sendError(errorTitle, tutorLogResponse.message, interaction);
        return;
      }
  
      console.log(tutorLogResponse);
      return;
    }
};

