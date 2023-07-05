import {
  Collection,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  TextBasedChannel,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { getRole, isMember } from "../../utils/supabase";

const getExpiredMembers = async (members: Collection<string, GuildMember>) => {
  const keys = members.keys();
  const removedMembers: GuildMember[] = [];
  for (let i = 0; i < members.size; i++) {
    const key = keys.next().value;
    if (!key) break;

    const member = members.get(key);
    if (!member) break;

    const discord_snowflake = member.id;
    const memberResponse = await isMember({ discord_snowflake });

    if (memberResponse.error || !memberResponse.data) {
      removedMembers.push(member);
    }
  }
  return removedMembers;
};

const removeExpiredMembers = async (
  removedMembers: GuildMember[],
  memberRole: Role,
  currentChannel: TextBasedChannel
) => {
  for (let i = 0; i < removedMembers.length; i++) {
    const member = removedMembers[i];
    const removedMember = createEmbeded(
      ` `,
      `**Pruned User: ${member}**`
    ).setColor("Red");
    await member.roles.remove(memberRole);
    currentChannel.send({ embeds: [removedMember] });
  }
};

export const prunemembers: Command = {
  data: new SlashCommandBuilder()
    .setName("prunemembers")
    .setDescription(
      "Prune the server of people with invalid/expired memberships!"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const guild = interaction.guild as Guild;

    commandLog(interaction, "/prunemembers", "Purple", []);

    const errorTitle = `❌ Prune Canceled!`;

    await guild.members.fetch();

    const roleResponse = await getRole("member", guild);

    if (roleResponse.error) {
      await sendError(errorTitle, roleResponse.message, interaction);
      return;
    }

    const memberRole = roleResponse.data;

    if (!memberRole) {
      await sendError(errorTitle, "Member role not found!", interaction);
      return;
    }

    const { members } = memberRole;
    const removedMembers = await getExpiredMembers(members);

    const removedCount = removedMembers.length;
    const suffix = removedMembers.length === 1 ? "" : "s";

    const returnMessage = createEmbeded(
      `🚪 Pruning ${removedCount} expired membership${suffix}!`,
      "Please wait until all users have been pruned."
    ).setColor("Purple");

    await interaction.editReply({ embeds: [returnMessage] });

    const currentChannel = interaction.channel as TextBasedChannel;

    await removeExpiredMembers(removedMembers, memberRole, currentChannel);

    const finishedMessage = createEmbeded("✅ Prune Completed!", " ").setColor(
      "Green"
    );

    currentChannel.send({ embeds: [finishedMessage] });
    return;
  },
};
