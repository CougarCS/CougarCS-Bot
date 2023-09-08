import {
  EmbedBuilder,
  Guild,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { GuildSelect, GuildUpdate } from "../../utils/types";
import {
  getGuildData,
  insertGuildData,
  updateGuildData,
} from "../../utils/supabase";
import { guildConfigFields } from "../../utils/embedFields";

const createUpdateEmbeds = (
  oldGuildData: GuildSelect,
  newGuildData: GuildSelect
): EmbedBuilder[] => {
  const embeds: EmbedBuilder[] = [];

  const returnMessage = createEmbed(
    "✅ Guild Config Updated!",
    "This guild's configuration information was updated!"
  ).setColor("Green");
  embeds.push(returnMessage);

  const oldConfigMessage = createEmbed("⏳ Old Config!", " ")
    .setColor("Red")
    .addFields(...guildConfigFields(oldGuildData));
  embeds.push(oldConfigMessage);

  const newConfigMessage = createEmbed("⌛ New Config!", " ")
    .setColor("Blue")
    .addFields(...guildConfigFields(newGuildData));

  embeds.push(newConfigMessage);
  return embeds;
};

export const setguildconfig: Command = {
  data: new SlashCommandBuilder()
    .setName("set-guild-config")
    .setDescription("Set the custom guild data!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addRoleOption((option) =>
      option
        .setName("member-role")
        .setDescription("The CougarCS Member Role!")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("officer-role")
        .setDescription("The CougarCS Officer Role!")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("admin-role")
        .setDescription("The CougarCS Admin Role!")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("tutor-role")
        .setDescription("The CougarCS Tutor Role!")
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName("tutoring-director")
        .setDescription("The CougarCS Tutoring Director!")
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("log-channel")
        .setDescription("The CougarCS Log Channel!")
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("report-channel")
        .setDescription("The CougarCS Report Channel!")
        .setRequired(false)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });

    const update: GuildUpdate = {
      member_role_id: interaction.options.get("member-role", false)?.value as
        | string
        | undefined,
      officer_role_id: interaction.options.get("officer-role", false)?.value as
        | string
        | undefined,
      admin_role_id: interaction.options.get("admin-role", false)?.value as
        | string
        | undefined,
      tutor_role_id: interaction.options.get("tutor-role", false)?.value as
        | string
        | undefined,
      log_channel_id: interaction.options.get("log-channel", false)?.value as
        | string
        | undefined,
      report_channel_id: interaction.options.get("report-channel", false)
        ?.value as string | undefined,
      tutoring_director_id: interaction.options.get("tutoring-director", false)
        ?.value as string | undefined,
    };

    commandLog(interaction, "/set-guild-config", "Green", [
      { name: "member-role", value: `<@&${update.member_role_id}>` },
      { name: "officer-role", value: `<@&${update.officer_role_id}>` },
      { name: "admin-role", value: `<@&${update.admin_role_id}>` },
      { name: "tutor-role", value: `<@&${update.tutor_role_id}>` },
      { name: "tutoring-director", value: `<@${update.tutoring_director_id}>` },
      { name: "log-channel", value: `<#${update.log_channel_id}>` },
      { name: "report-channel", value: `<#${update.report_channel_id}>` },
    ]);

    const errorTitle = "❌ Config Canceled!";

    const noParams = !(
      update.admin_role_id ||
      update.officer_role_id ||
      update.member_role_id ||
      update.tutor_role_id ||
      update.log_channel_id ||
      update.report_channel_id ||
      update.tutoring_director_id
    );

    if (noParams) {
      await sendError(
        errorTitle,
        "No update parameters specified!",
        interaction
      );
      return;
    }

    const guild = interaction.guild as Guild;

    let guildResponse = await getGuildData(guild);

    if (guildResponse.error) {
      guildResponse = await insertGuildData(guild);
    }

    if (guildResponse.error) {
      await sendError(errorTitle, guildResponse.message, interaction);
      return;
    }

    const oldGuildData = guildResponse.data;

    const updateResponse = await updateGuildData(update, guild);

    if (updateResponse.error) {
      await sendError(errorTitle, updateResponse.message, interaction);
      return;
    }

    const newGuildData = updateResponse.data;

    const embeds = createUpdateEmbeds(oldGuildData, newGuildData);

    await interaction.editReply({ embeds });
    return;
  },
};
