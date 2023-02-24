import {
  GuildMember,
  GuildMemberManager,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { findMemberWithSnowflake } from "../../utils/supabase";

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
    commandLog(interaction, "/pruneexpiredmembers", "Purple", []);

    const gmm = interaction.guild?.members as GuildMemberManager;

    await gmm.fetch();
    const memberRole = interaction.guild?.roles.cache.find(
      (r) => r.name === "Member"
    ) as Role;

    const removedMembers: GuildMember[] = [];
    const { members } = memberRole;
    const keys = members.keys();
    for (let i = 0; i < members.size; i++) {
      const key = keys.next().value;
      if (!key) break;
      const m = members.get(key);
      if (!m) break;
      if ((await findMemberWithSnowflake(m.id)).status === "failure") {
        await m.roles.remove(memberRole);
        removedMembers.push(m);
      }
    }

    let removedString = "";
    removedMembers.forEach((m) => {
      removedString = `${removedString}${m.user}\n`;
    });

    const returnMessage = createEmbeded(
      `🚪 Removed ${removedMembers.length} expired membership${
        removedMembers.length === 1 ? "" : "s"
      }!`,
      `**Removed users:**\n${removedString}`,
      client
    )
      .setColor("Purple")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
