import { Command } from "../../interfaces/Command";
import { commandLog, sendError } from "../../utils/logs";
import { Guild, SlashCommandBuilder } from "discord.js";
import { TutorLogInsert } from "../../utils/types";
import {
  getContactId,
  getTutorId,
  insertTutorLog,
  getTutoringType,
  getRole,
} from "../../utils/supabase";
import { createEmbed } from "../../utils/embeded";
import { tutoringTypeOptions } from "../../utils/options";

export const tutorlog: Command = {
  data: new SlashCommandBuilder()
    .setName("tutor-log")
    .setDescription("Log your tutor hours")
    .addStringOption((option) => {
      tutoringTypeOptions().then((types) => option.setChoices(...types));
      return option
        .setName("tutoring-type")
        .setDescription("Type of tutoring!")
        .setRequired(true);
    })
    .addStringOption((option) =>
      option
        .setName("tutored-user")
        .setDescription("Name(s) of the student you tutored")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("hours")
        .setDescription("How many hours did you tutor?")
        .setMinValue(1)
        .setMaxValue(6)
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
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const tutoring_type_id = interaction.options.get("tutoring-type", true)
      .value as string;
    const tutored_user = interaction.options.get("tutored-user", true)
      .value as string;
    const hours = interaction.options.get("hours", true).value as number;
    const description = interaction.options.get("description", false)?.value as
      | string
      | null;

    commandLog(interaction, "/tutor-log", "Orange", [
      { name: "tutoring-type", value: `${tutoring_type_id}` },
      { name: "tutored-user", value: `${tutored_user}` },
      { name: "hours", value: `${hours}` },
      { name: "description", value: `${description}` },
    ]);

    const errorTitle = "❌ Tutor Log Failed!";

    const discord_snowflake = user.id as string;

    const tutorRoleResponse = await getRole("tutor", guild);

    if (tutorRoleResponse.error) {
      await sendError(errorTitle, tutorRoleResponse.message, interaction);
      return;
    }

    const tutorRole = tutorRoleResponse.data;

    const member = await guild.members.fetch({ user });

    const hasTutorRole = member.roles.cache.find((r) => r === tutorRole);

    if (!hasTutorRole) {
      await sendError(
        errorTitle,
        "You do not have the tutor role. This command is available for tutors only!",
        interaction
      );
      return;
    }

    const contactIdResponse = await getContactId({ discord_snowflake });

    if (contactIdResponse.error) {
      await sendError(
        errorTitle,
        "Your contact could not be found!",
        interaction
      );
      return;
    }

    const contact_id = contactIdResponse.data;

    const tutorIdResponse = await getTutorId({ contact_id });

    if (tutorIdResponse.error) {
      await sendError(
        errorTitle,
        "Your current tutor data could not be found!",
        interaction
      );
      return;
    }

    const tutor_id = tutorIdResponse.data;

    const tutorLog: TutorLogInsert = {
      tutor_id,
      tutoring_type_id,
      tutored_user,
      hours,
      description,
    };

    const tutorLogResponse = await insertTutorLog(tutorLog);

    if (tutorLogResponse.error) {
      await sendError(errorTitle, tutorLogResponse.message, interaction);
      return;
    }

    const tutoringTypeResponse = await getTutoringType(tutoring_type_id);

    if (tutoringTypeResponse.error) {
      await sendError(errorTitle, tutoringTypeResponse.message, interaction);
      return;
    }

    const tutoringTypeName = tutoringTypeResponse.data.message;

    const returnMessage = createEmbed("📝 Tutor Log Submitted!", " ")
      .setColor("Green")
      .addFields(
        {
          name: "Tutoring Type",
          value: tutoringTypeName,
          inline: true,
        },
        {
          name: "Person(s) Tutored",
          value: `${tutored_user}`,
          inline: true,
        },
        {
          name: "Hours",
          value: `${hours}`,
          inline: true,
        }
      );

    if (description) {
      returnMessage.addFields({ name: "Description", value: description });
    }

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
