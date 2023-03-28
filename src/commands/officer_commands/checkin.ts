import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { eventOptions } from "../../utils/options";
import {
  getContact,
  getEventAttendance,
  insertEventAttendance,
} from "../../utils/supabase";
import { EventAttendanceInsert, UniqueContactQuery } from "../../utils/types";

export const checkin: Command = {
  data: new SlashCommandBuilder()
    .setName("checkin")
    .setDescription("Check someone into a CougarCS event!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((options) => {
      eventOptions().then((e) => options.setChoices(...e));
      return options
        .setName("event")
        .setDescription("The CougarCS event!")
        .setRequired(true);
    })
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
    )
    .addBooleanOption((options) =>
      options
        .setName("swag")
        .setDescription("Indicate if the member got swag!")
        .setRequired(false)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const contactQuery: UniqueContactQuery = {
      uh_id: interaction.options.get("psid", false)?.value as
        | number
        | undefined,
      email: interaction.options.get("email", false)?.value as
        | string
        | undefined,
      discord_snowflake: interaction.options.get("discord", false)?.value as
        | string
        | undefined,
    };

    const eventOption = interaction.options.get("event", true);
    const swagOption = interaction.options.get("swag", false);

    const event_id = eventOption.value as string;
    const swag = !!swagOption?.value;

    commandLog(interaction, "/checkin", "Green", [
      { name: "event", value: `${event_id}` },
      { name: "psid", value: `${contactQuery.uh_id}` },
      { name: "email", value: `${contactQuery.email}` },
      { name: "discord", value: `<@${contactQuery.discord_snowflake}>` },
      { name: "swag", value: `${swag}` },
    ]);

    const errorTitle = "❌ Check In Canceled!";

    const noParams = !(
      contactQuery.uh_id ||
      contactQuery.email ||
      contactQuery.discord_snowflake
    );

    if (noParams) {
      await sendError(
        errorTitle,
        "No search parameters specified!",
        interaction
      );
      return;
    }

    const contactResponse = await getContact(contactQuery);

    if (contactResponse.error) {
      await sendError(errorTitle, contactResponse.message, interaction);
      return;
    }

    const contact = contactResponse.data[0];
    const { contact_id } = contact;
    const identifier = contact.discord_snowflake
      ? `<@${contact.discord_snowflake}>`
      : `${contact.first_name} ${contact.last_name}`;
    const prevAttendanceResponse = await getEventAttendance({ contact_id });

    if (!prevAttendanceResponse.error) {
      await sendError(
        errorTitle,
        `${identifier} is already checked into this event!`,
        interaction
      );
      return;
    }

    const timestamp = new Date().toISOString();

    const attendance: EventAttendanceInsert = {
      contact_id,
      event_id,
      swag,
      timestamp,
    };

    const attendanceResponse = await insertEventAttendance(attendance);

    if (attendanceResponse.error) {
      await sendError(errorTitle, attendanceResponse.message, interaction);
      return;
    }

    const returnMessage = createEmbeded(
      "✅ Checked In!",
      `${identifier} has been checked into the event!`,
      client
    ).setColor("Green");

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
