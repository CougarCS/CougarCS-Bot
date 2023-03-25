import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { eventOptions } from "../../utils/options";
import {
  getContact,
  getEvent,
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

    const psidOption = interaction.options.get("psid", false);
    const emailOption = interaction.options.get("email", false);
    const discordOption = interaction.options.get("discord", false);
    const eventOption = interaction.options.get("event", true);
    const swagOption = interaction.options.get("swag", false);

    const uh_id = (psidOption && (psidOption.value as number)) || undefined;
    const email = (emailOption && (emailOption.value as string)) || undefined;
    const discord_snowflake =
      (discordOption && (discordOption.user?.id as string)) || undefined;
    const event_id = eventOption.value as string;
    const swag = !!swagOption?.value;

    commandLog(interaction, "/checkin", "Green", [
      { name: "event", value: `${event_id}` },
      { name: "psid", value: `${uh_id}` },
      { name: "email", value: `${email}` },
      { name: "discord", value: `<@${discord_snowflake}>` },
      { name: "swag", value: `${swag}` },
    ]);

    const errorMessage = createEmbeded(
      "❌ Check In canceled!",
      "There was an error performing this command!",
      client
    ).setColor("Red");

    const noParams = !(uh_id || email || discord_snowflake);

    if (noParams) {
      errorMessage.setDescription("No search parameters specified!");
      interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const contactQuery: UniqueContactQuery = {
      uh_id,
      email,
      discord_snowflake,
    };

    const contactResponse = await getContact(contactQuery);

    if (contactResponse.error) {
      errorMessage.setDescription(contactResponse.message);
      interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const contact = contactResponse.data[0];
    const { contact_id } = contact;
    const identifier = contact.discord_snowflake
      ? `<@${contact.discord_snowflake}>`
      : `${contact.first_name} ${contact.last_name}`;
    const prevAttendanceResponse = await getEventAttendance({ contact_id });

    if (!prevAttendanceResponse.error) {
      errorMessage.setDescription(
        `${identifier} is already checked into this event!`
      );
      interaction.editReply({ embeds: [errorMessage] });
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
      errorMessage.setDescription(attendanceResponse.message);
      interaction.editReply({ embeds: [errorMessage] });
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
