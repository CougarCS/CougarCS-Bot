import { Command } from "../../interfaces/Command";
import { commandLog, sendError } from "../../utils/logs";
import { SlashCommandBuilder } from "discord.js";
import { TutorLogInsert } from "../../utils/types";
import { getContactId, getTutorId, insertTutorLog } from "../../utils/supabase";
import { createEmbeded } from "../../utils/embeded";

export const tutorlog: Command = {
  data : new  SlashCommandBuilder()
    .setName("tutor-log")
    .setDescription("Log your tutor hours")
    .addStringOption((option) => 
      option
        // .setName("tutoring-type")
        // .setDescription("Type of tutoring session you engaged in!")
        // .addChoices(
        //   {name: 'In Person', value: 't-ip'},
        //   {name: 'Online Voice Chat', value: 't-ov'},
        //   {name: 'Online Text Chat', value: 't-ot'}
        // )
        // .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tutored-user")
        .setDescription("Name(s) of the student you tutored")
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
      .setDescription("Description of the tutoring session")
      .setRequired(false)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const tutoring_type_id = interaction.options.get("tutoring-type", true).value as string
    const tutored_user =  interaction.options.get("tutored-user", true).value as string 
    const hours = interaction.options.get("hours", true).value as number
    const description = interaction.options.get("description", false)?.value as | string | null 
    
    commandLog(interaction, "/tutor-log", "Orange", [
      { name: "tutoring-type", value: `${tutoring_type_id}`},
      { name: "tutored-user", value: `${tutored_user}`},
      { name: "hours", value: `${hours}`},
      { name: "description", value: `${description}`}
    ]);

    const discord_snowflake = interaction.user?.id as string;

    const contactIdResponse = await getContactId({discord_snowflake});
    
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

    const tutorLog: TutorLogInsert = {
      tutor_id, tutoring_type_id, tutored_user, hours, description
    };

    const tutorLogResponse = await insertTutorLog(tutorLog);

    if (tutorLogResponse.error){
      await sendError(errorTitle, tutorLogResponse.message, interaction);
      return;
    }

    const returnMessage = createEmbeded(
      "📝 Tutor Log Submitted!",
      "Your tutoring hours have been submitted!"
    ).setColor("Green");
          
    await interaction.editReply({ embeds: [returnMessage] });
    return;  
  },
};

