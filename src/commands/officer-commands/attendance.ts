import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed, sendBulkEmbeds } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { getEvent, getEventAttendance } from "../../utils/supabase";
import { AttendanceSelect } from "src/utils/types";

const attendanceEmbeds = async (
  attendanceArray: AttendanceSelect[]
): Promise<EmbedBuilder[]> => {
  const attendanceEmbeds: EmbedBuilder[] = [];
  const attendanceCount = attendanceArray.length;
  const suffix = attendanceCount === 1 ? "" : "s";
  const infoMessage = createEmbed(
    `🔎 Found ${attendanceCount} result${suffix}:`,
    " "
  ).setColor("Yellow");
  attendanceEmbeds.push(infoMessage);

  for (let i = 0; i < attendanceCount; i++) {
    const attendance = attendanceArray[i];
    const { event_id } = attendance;
    const eventResponse = await getEvent(event_id);
    const eventTitle = !eventResponse.error && eventResponse.data;
    const identifier = eventTitle || event_id;
    const embed = createEmbed(`${identifier} ✅`, " ").setColor("Green");
    attendanceEmbeds.push(embed);
  }
  return attendanceEmbeds;
};

export const attendance: Command = {
  data: new SlashCommandBuilder()
    .setName("attendance")
    .setDescription("Check a user's event attendance data!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
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
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });

    const psidOption = interaction.options.get("psid", false);
    const emailOption = interaction.options.get("email", false);
    const discordOption = interaction.options.get("discord", false);

    const uh_id = (psidOption && (psidOption.value as number)) || undefined;
    const email = (emailOption && (emailOption.value as string)) || undefined;
    const discord_snowflake =
      (discordOption && (discordOption.user?.id as string)) || undefined;

    commandLog(interaction, "/attendance", "Green", [
      { name: "psid", value: `${uh_id}` },
      { name: "email", value: `${email}` },
      { name: "discord", value: `<@${discord_snowflake}>` },
    ]);

    const errorTitle = "❌ Search Canceled!";

    const noParams = !(uh_id || email || discord_snowflake);

    if (noParams) {
      await sendError(
        errorTitle,
        "No search parameters specified!",
        interaction
      );
      return;
    }

    const attendanceResponse = await getEventAttendance({
      uh_id,
      email,
      discord_snowflake,
    });

    if (attendanceResponse.error) {
      await sendError(errorTitle, attendanceResponse.message, interaction);
      return;
    }

    const attendanceArray = attendanceResponse.data;
    const embeds = await attendanceEmbeds(attendanceArray);

    await sendBulkEmbeds(interaction, embeds);
    return;
  },
};
