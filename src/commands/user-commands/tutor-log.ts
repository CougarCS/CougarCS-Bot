import { Command } from "../../interfaces/Command";
import { commandLog, sendError } from "../../utils/logs";
import { SlashCommandBuilder } from "discord.js";
import { reportOptions } from "../../utils/options";
import { TutorLogInsert } from "../../utils/types";
import { getContactId, getTutorId, insertTutorLog } from "../../utils/supabase";
import { createEmbeded } from "../../utils/embeded";


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
        .setRequired(true)
    )
    .addStringOption((option) =>
    option
    .setName("description")
    .setDescription("Optional description of the tutoring session")
    .setRequired(false)
    )
  ,
    run: async (interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const discord_snowflake = interaction.user?.id as string;

        const contactIdResponse = await  getContactId({discord_snowflake});

        const errorTitle = "❌ Tutor Log Failed!";
        
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

        const create: TutorLogInsert = {
          tutor_id: tutor_id as string,
          tutoring_type_id: interaction.options.get("tutoring-type", true).value as string,
          tutored_user: interaction.options.get("tutored-user", true).value as string,
          hours: interaction.options.get("hours", true).value as number,
          description: interaction.options.get("description", false)?.value as | string | null,
        };

        const tutorLogResponse = await insertTutorLog(create);

        if (tutorLogResponse.error){
          await sendError(errorTitle, tutorLogResponse.message, interaction);
          return;
        }

        const returnMessage = createEmbeded(
          "📝 Tutor Log Submitted!",
          "Your tutoring hours have been submitted!"
        ).setColor("Green");
          
        await interaction.editReply({ embeds: [returnMessage] });
        
        commandLog(interaction, "/tutor-log", "Orange", [
          { name: "tutor-log", value: `${create.tutor_log_id}`},
          { name: "tutoring-type", value: `${create.tutoring_type_id}`},
          { name: "tutored-user", value: `${create.tutored_user}`},
          { name: "hours", value: `${create.hours}`},
          { name: "description", value: `${create.description}`}
        ]);
          
        return;  
    }
};

