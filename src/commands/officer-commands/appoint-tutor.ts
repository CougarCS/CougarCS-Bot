import {
  Guild,
  PermissionFlagsBits,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import {
    getContactId,
  getRole,
  getTutor,
  insertTutor,
} from "../../utils/supabase";

export const appointTutor: Command = {
  data: new SlashCommandBuilder()
    .setName("appoint-tutor")
    .setDescription("Appoint a tutor for CougarCS!")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to appoint as a tutor!")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const guild = interaction.guild as Guild;
    const appointedUser = interaction.options.get("user", true).user as User;

    commandLog(interaction, "/appoint-tutor", "Blue", [
      { name: "user", value: `${appointedUser}` },
    ]);

    const errorTitle = "❌ Appoint Tutor Failed!";

    const contactIdResponse = await getContactId({
      discord_snowflake: appointedUser.id,
    });

    if (contactIdResponse.error) {
      sendError(
        errorTitle,
        `${appointedUser} does not have a contact!`,
        interaction
      );
      return;
    }

    const tutorRoleResponse = await getRole("tutor", guild);

    if (!tutorRoleResponse.error) {
      const tutorRole = tutorRoleResponse.data;

      const member = await guild.members.fetch({ user: appointedUser });

      member.roles.add(tutorRole);
    }

    const contact_id = contactIdResponse.data;

    const tutorResponse = await getTutor({ contact_id });

    if (tutorResponse.error) {
      sendError(
        errorTitle,
        `${appointedUser} is already a tutor!`,
        interaction
      );
      return;
    }

    const tutorInsertResponse = await insertTutor(contact_id);

    if (tutorInsertResponse.error) {
      sendError(errorTitle, tutorInsertResponse.message, interaction);
      return;
    }

    const returnMessage = createEmbed(
      "🎓 Tutor Appointed!",
      `${appointedUser} has been added as a tutor for this semester!`
    ).setColor("Green");

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
