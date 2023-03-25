import {
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded, sendBulkEmbeds } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getEvent, getEventAttendance } from "../../utils/supabase";

const attendanceEmbeds = async (
  attendanceArray: any[],
  client: Client
): Promise<EmbedBuilder[]> => {
  const attendanceEmbeds: EmbedBuilder[] = [];
  const attendanceCount = attendanceArray.length;
  const suffix = attendanceCount === 1 ? "" : "s";
  const infoMessage = createEmbeded(
    `🔎 Found ${attendanceCount} result${suffix}:`,
    " ",
    client
  ).setColor("Yellow");
  attendanceEmbeds.push(infoMessage);

  for (let i = 0; i < attendanceCount; i++) {
    const attendance = attendanceArray[i];
    const { event_id } = attendance;
    const eventResponse = await getEvent(event_id);
    const identifier = eventResponse.data[0]?.title || event_id;
    const embed = createEmbeded(`${identifier} ✅`, " ", client).setColor(
      "Green"
    );
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
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

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

    const errorMessage = createEmbeded(
      "❌ Search Canceled!",
      "There was an error performing this command!",
      client
    ).setColor("Red");

    const noParams = !(uh_id || email || discord_snowflake);

    if (noParams) {
      errorMessage.setDescription("No search parameters specified!");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const attendanceResponse = await getEventAttendance({
      uh_id,
      email,
      discord_snowflake,
    });

    if (attendanceResponse.error) {
      errorMessage.setDescription(attendanceResponse.message);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const attendanceArray = attendanceResponse.data;
    const embeds = await attendanceEmbeds(attendanceArray, client);

    await sendBulkEmbeds(interaction, embeds);
    return;
  },
};
