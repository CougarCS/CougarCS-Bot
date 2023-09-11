import { CommandInteraction, EmbedBuilder } from "discord.js";

export function createEmbed (title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor("Green")
    .setTitle(title)
    .setDescription(message)
    .setTimestamp(null)
    .setFooter(null);
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

  await interaction.editReply({ embeds: embedChunks[0] });

  for (let i = 1; i < embedChunks.length; i++) {
    await interaction.followUp({ embeds: embedChunks[i] });
  }
};
