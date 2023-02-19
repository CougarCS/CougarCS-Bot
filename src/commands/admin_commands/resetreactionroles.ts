import { channel } from "diagnostics_channel";
import { ChannelType, SlashCommandBuilder, TextChannel } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import {
  frameworkIcons,
  frameworkNames,
  languageIcons,
  languageNames,
  ReactionRoleGiver,
} from "../../utils/reactions";

export const resetreactionroles: Command = {
  data: new SlashCommandBuilder()
    .setName("resetreactionroles")
    .setDescription(
      "Reset the reaction roles and designate the appropriate channel"
    )
    .addChannelOption((option) => {
      return option
        .setName("channel")
        .setDescription("The channel where the reaction roles should be")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText);
    }),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    // const role = interaction.guild?.roles.cache.find(
    //   (r) => r.name === "Member"
    // );
    // if (!role) return;
    // const members = role?.members;
    // members?.forEach((member) => member.roles.remove(role));

    let languageBody = "React to give yourself a role!\n\n";
    for (let i = 0; i < languageIcons.length; i++) {
      languageBody += languageIcons.at(i) + " `" + languageNames.at(i) + "`\n";
    }
    const languageRoles = createEmbeded(
      "Roles: Programming Languages",
      languageBody,
      user,
      client
    )
      .setColor("Blue")
      .setFooter(null)
      .setTimestamp(null);

    let frameworkBody = "React to give yourself a role!\n\n";
    for (let i = 0; i < frameworkIcons.length; i++) {
      frameworkBody +=
        frameworkIcons.at(i) + " `" + frameworkNames.at(i) + "`\n";
    }
    const frameworkRoles = createEmbeded(
      "Roles: Frameworks",
      frameworkBody,
      user,
      client
    )
      .setColor("Purple")
      .setFooter(null)
      .setTimestamp(null);

    const targetChannel = interaction.options.get("channel", true).channel?.id;
    if (!targetChannel) return;
    const channel = interaction.guild?.channels.cache.get(
      targetChannel
    ) as TextChannel;
    if (!channel) return;
    await channel.bulkDelete(5);

    const languageMessage = await channel.send({
      embeds: [languageRoles],
    });
    const frameworkMessage = await channel.send({
      embeds: [frameworkRoles],
    });

    await ReactionRoleGiver(languageMessage, languageIcons);
    await ReactionRoleGiver(frameworkMessage, frameworkIcons);

    const responseMessage = createEmbeded(
      "**Success!**",
      `The reaction role messages have been reset in ${channel}`,
      user,
      client
    )
      .setColor("Green")
      .setFooter(null)
      .setTimestamp(null);

    await interaction.editReply({ embeds: [responseMessage] });
    return;
  },
};
