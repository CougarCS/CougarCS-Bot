import {
  ChannelType,
  ColorResolvable,
  CommandInteraction,
  Role,
  TextChannel,
} from "discord.js";
import { Guild } from "discord.js";
import { createEmbeded } from "./embeded";
import { getChannel, getRole } from "./supabase";

export const commandLog = async (
  interaction: CommandInteraction,
  commandName: string,
  color: ColorResolvable,
  params: { name: string; value: string }[]
) => {
  const guild = interaction.guild as Guild;
  const channelResponse = await getChannel("log", guild);

  if (channelResponse.error) return;

  const logChannel = channelResponse.data[0];

  let fullCommand = commandName;
  params.forEach((p) => {
    fullCommand = `${fullCommand} \`${p.name}:\`${p.value}`;
  });

  const message = createEmbeded(
    `Log ${commandName}`,
    `${interaction.user} used **${commandName}** in ${interaction.channel}`,
    interaction.client
  )
    .setColor(color)
    .setTimestamp()
    .addFields({
      name: "Full Command",
      value: `${fullCommand}`,
    });

  logChannel.send({ embeds: [message] });
};

export const report = async (
  interaction: CommandInteraction,
  type: string,
  message: string
) => {
  const guild = interaction.guild as Guild;
  const channelResponse = await getChannel("report", guild);

  if (channelResponse.error) return;

  const reportChannel = channelResponse.data[0];

  const report = createEmbeded(
    `📢 User Report!`,
    `**${interaction.user} submitted the following report in ${interaction.channel}:**\n"${message}"`,
    interaction.client
  )
    .setColor("Red")
    .setTimestamp()
    .addFields({
      name: "Report Type",
      value: type,
    });

  const roleResponse = await getRole("officer", guild);

  const officerRole = roleResponse.data[0];

  reportChannel.send({
    embeds: [report],
    content: `${officerRole}`,
  });
};

export const log = async (
  title: string,
  body: string,
  color: ColorResolvable,
  guild: Guild
) => {
  const message = createEmbeded(title, body, guild.client)
    .setColor(color)
    .setTimestamp();

  const channelResponse = await getChannel("log", guild);

  console.log(`${guild.name}: ${channelResponse.message}`);

  if (channelResponse.error) return;

  const logChannel = channelResponse.data[0];

  logChannel.send({ embeds: [message] });
};

export const sendError = async (
  errorTitle: string,
  errorMessage: string,
  interaction: CommandInteraction
) => {
  const errorEmbed = createEmbeded(
    errorTitle,
    errorMessage,
    interaction.client
  ).setColor("Red");
  await interaction.editReply({ embeds: [errorEmbed] });
};
