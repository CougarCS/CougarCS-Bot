import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { ReactionRoleGiver } from "../../utils/reactions";

export const rolegiver: Command = {
  data: new SlashCommandBuilder()
    .setName("rolegiver")
    .setDescription("Send a message for people to get roles!")
    .addStringOption((option) =>
      option
        .setName("roletype")
        .setDescription("What is the type of roles that you are adding")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("roles")
        .setDescription(
          'Please enter your emojis and role names separated by comma + space: ", "'
        )
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: true });
    const { user } = interaction;
    const type = interaction.options.get("roletype", true).value as string;
    const roleString = interaction.options.get("roles", true).value as string;
    commandLog(interaction, "/rolegiver", "Green", [
      { name: "roletype", value: type },
      { name: "roles", value: roleString },
    ]);
    const roleParse = roleString.split(", ");
    const emojis: string[] = [];
    let bodyText = "";
    for (let i = 1; i < roleParse.length; i += 2) {
      bodyText = `${bodyText}${roleParse[i - 1]} \`${roleParse[i]}\`\n`;
      emojis.push(roleParse[i - 1]);
    }

    const successMessage = createEmbeded(
      "✅ Reaction Roles Sent!",
      "Your reaction roles have been sent in this channel!",
      client
    )
      .setColor("Green")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [successMessage] });

    const roleMessage = createEmbeded(`Roles: ${type}`, bodyText, client)
      .setColor("Green")
      .setFooter(null)
      .setTimestamp(null);
    if (!interaction.channel) return;
    const roleSentMessage = await (interaction.channel as TextChannel).send({
      embeds: [roleMessage],
    });

    await ReactionRoleGiver(roleSentMessage, emojis);
    return;
  },
};
