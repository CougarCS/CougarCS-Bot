import {
  Client,
  EmbedBuilder,
  Guild,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
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
  newGuildData: GuildSelect,
  client: Client
): EmbedBuilder[] => {
  const embeds: EmbedBuilder[] = [];

  const returnMessage = createEmbeded(
    "✅ Guild Config Updated!",
    "This guild's configuration information was updated!",
    client
  ).setColor("Green");
  embeds.push(returnMessage);

  const oldConfigMessage = createEmbeded("⏳ Old Config!", " ", client)
    .setColor("Red")
    .addFields(...guildConfigFields(oldGuildData));
  embeds.push(oldConfigMessage);

  const newConfigMessage = createEmbeded("⌛ New Contact!", " ", client)
    .setColor("Blue")
    .addFields(...guildConfigFields(newGuildData));

  embeds.push(newConfigMessage);
  return embeds;
};

export const setguildconfig: Command = {
  data: new SlashCommandBuilder()
    .setName("setguildconfig")
    .setDescription("Set the custom guild data!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addRoleOption((option) =>
      option
        .setName("memberrole")
        .setDescription("The CougarCS Member Role!")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("officerrole")
        .setDescription("The CougarCS Officer Role!")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("adminrole")
        .setDescription("The CougarCS Admin Role!")
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("logchannel")
        .setDescription("The CougarCS Log Channel!")
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("reportchannel")
        .setDescription("The CougarCS Report Channel!")
        .setRequired(false)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const update: GuildUpdate = {
      member_role_id: interaction.options.get("memberrole", false)?.value as
        | string
        | undefined,
      officer_role_id: interaction.options.get("officerrole", false)?.value as
        | string
        | undefined,
      admin_role_id: interaction.options.get("adminrole", false)?.value as
        | string
        | undefined,
      log_channel_id: interaction.options.get("logchannel", false)?.value as
        | string
        | undefined,
      report_channel_id: interaction.options.get("reportchannel", false)
        ?.value as string | undefined,
    };

    commandLog(interaction, "/ping", "Green", [
      { name: "memberrole", value: `<@&${update.member_role_id}>` },
      { name: "officerrole", value: `<@&${update.officer_role_id}>` },
      { name: "adminrole", value: `<@&${update.admin_role_id}>` },
      { name: "logchannel", value: `<#${update.log_channel_id}>` },
      { name: "reportchannel", value: `<#${update.report_channel_id}>` },
    ]);

    const errorTitle = "❌ Config Canceled!";

    const noParams = !(
      update.admin_role_id ||
      update.officer_role_id ||
      update.member_role_id ||
      update.log_channel_id ||
      update.report_channel_id
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

    const oldGuildData = guildResponse.data[0] as GuildSelect;

    const updateResponse = await updateGuildData(update, guild);

    if (updateResponse.error) {
      await sendError(errorTitle, updateResponse.message, interaction);
      return;
    }

    const newGuildData = updateResponse.data[0] as GuildSelect;

    const embeds = createUpdateEmbeds(oldGuildData, newGuildData, client);

    await interaction.editReply({ embeds });
    return;
  },
};
