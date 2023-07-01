import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { ReactionRoleGiver } from "../../utils/reactions";

const removeWhitespace = (input: string): string => {
  let output = input;
  while (output.includes(" ")) {
    const index = output.indexOf(" ");
    output = output.substring(0, index) + output.substring(index + 1);
  }
  return output;
};

const parseSplit = (
  roleParse: string[]
): { body: string; rolePairs: { emoji: string; role: string }[] } => {
  const emojiRoles = [];
  let bodyText = "";
  for (let i = 0; i < roleParse.length; i += 2) {
    const emoji = removeWhitespace(roleParse[i]);
    const role = roleParse[i + 1];

    emojiRoles.push({ emoji, role });
    bodyText = `${bodyText}${roleParse[i]} \`${roleParse[i + 1]}\`\n`;
  }
  return {
    body: bodyText,
    rolePairs: emojiRoles,
  };
};

export const rolegiver: Command = {
  data: new SlashCommandBuilder()
    .setName("rolegiver")
    .setDescription("Send a message for people to get roles!")
    .addStringOption((option) =>
      option
        .setName("roletype")
        .setDescription("What is the type of roles that you are adding!")
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
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const type = interaction.options.get("roletype", true).value as string;
    const roleString = interaction.options.get("roles", true).value as string;

    commandLog(interaction, "/rolegiver", "Green", [
      { name: "roletype", value: type },
      { name: "roles", value: roleString },
    ]);

    const errorTitle = "❌ Reaction Roles Failed!";

    const roleParse = roleString.split(", ");

    if (roleParse.length % 2 === 1) {
      await sendError(
        errorTitle,
        "You must enter your emoji + description pairs in order and complete!",
        interaction
      );
      return;
    }

    const { body, rolePairs } = parseSplit(roleParse);

    const returnMessage = createEmbeded(
      "✅ Reaction Roles Sent!",
      "Your reaction roles have been sent in this channel!"
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });

    const roleMessage = createEmbeded(`Roles: ${type}`, body).setColor(
      "Orange"
    );

    const roleSentMessage = await (interaction.channel as TextChannel).send({
      embeds: [roleMessage],
    });

    await ReactionRoleGiver(roleSentMessage, rolePairs);
    return;
  },
};
