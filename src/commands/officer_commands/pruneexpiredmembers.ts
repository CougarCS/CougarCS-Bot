import {
  Guild,
  GuildMember,
  GuildMemberManager,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  TextBasedChannel,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded, sendBulkEmbeds } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { isMember } from "../../utils/supabase";
import { EmbedBuilder } from "@discordjs/builders";

export const pruneexpiredmembers: Command = {
  data: new SlashCommandBuilder()
    .setName("pruneexpiredmembers")
    .setDescription(
      "Prune the server of people with invalid/expired memberships!"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    commandLog(interaction, "/pruneexpiredmembers", "Purple", []);

    await guild.members.fetch();

    const memberRole = guild.roles.cache.find((r) => r.name === "Member");

    if (!memberRole) {
      const errorMessage = createEmbeded(
        `❌ Prune Canceled!`,
        `Member role not found!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const removedMembers: GuildMember[] = [];
    const { members } = memberRole;
    const keys = members.keys();

    for (let i = 0; i < members.size; i++) {
      const key = keys.next().value;
      if (!key) break;

      const member = members.get(key);
      if (!member) break;

      const discord_snowflake = member.id;
      const memberResponse = await isMember({ discord_snowflake });

      if (memberResponse.error || !memberResponse.data[0]) {
        removedMembers.push(member);
      }
    }

    const removedCount = removedMembers.length;
    const suffix = removedMembers.length === 1 ? "" : "s";

    const returnMessage = createEmbeded(
      `🚪 Pruning ${removedCount} expired membership${suffix}!`,
      "Please wait until all users have been pruned.",
      client
    ).setColor("Purple");

    await interaction.editReply({ embeds: [returnMessage] });

    const currentChannel = interaction.channel as TextBasedChannel;

    for (let i = 0; i < removedCount; i++) {
      const member = removedMembers[i];
      const removedMember = createEmbeded(
        ` `,
        `**Pruned User: ${member}**`,
        client
      ).setColor("Red");
      await member.roles.remove(memberRole);
      currentChannel.send({ embeds: [removedMember] });
    }

    const finishedMessage = createEmbeded(
      "✅ Prune Completed!",
      " ",
      client
    ).setColor("Green");
    currentChannel.send({ embeds: [finishedMessage] });

    return;
  },
};
