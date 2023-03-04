import { Client, CommandInteraction, EmbedBuilder, User } from "discord.js";

export function createEmbeded(
  title: string,
  message: string,
  client: Client
): EmbedBuilder {
  let iconURL: string | null | undefined;

  if (
    client.user?.avatarURL({ extension: "png" }) === null ||
    client.user?.avatarURL({ extension: "png" }) === undefined
  ) {
    iconURL = "https://avatars.githubusercontent.com/u/107168679?s=200&v=4";
  } else {
    iconURL = client.user?.avatarURL({ extension: "png" });
  }

  return new EmbedBuilder()
    .setColor("#ffeded")
    .setTitle(title)
    .setDescription(message)
    .setTimestamp()
    .setFooter({
      text: `${client.user?.tag}`,
      iconURL: iconURL as string,
    });
}

export const sendBulkEmbeds = async (
  interaction: CommandInteraction,
  embedArray: EmbedBuilder[]
) => {
  const embedChunks: EmbedBuilder[][] = [];
  for (let i = 0; i < embedArray.length; i++) {
    if (i % 10 === 0) embedChunks.push([]);
    const currentArray = embedChunks[embedChunks.length - 1];
    currentArray.push(embedArray[i]);
  }
  interaction.editReply({ embeds: embedChunks[0] });
  for (let i = 1; i < embedChunks.length; i++)
    interaction.followUp({ embeds: embedChunks[i] });
};
