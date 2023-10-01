import {
  ButtonInteraction,
  ColorResolvable,
  CommandInteraction,
} from "discord.js";
import { Guild } from "discord.js";
import { createEmbed } from "./embeded";
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

  const logChannel = channelResponse.data;

  let fullCommand = commandName;
  params.forEach((p) => {
    fullCommand = `${fullCommand} \`${p.name}:\`${p.value}`;
  });

  const message = createEmbed(
    `Log ${commandName}`,
    `${interaction.user} used **${commandName}** in ${interaction.channel}`
  )
    .setColor(color)
    .setTimestamp()
    .addFields({
      name: "Full Command",
      value: `${fullCommand}`,
    });

  try {
    logChannel.send({ embeds: [message] });
  } catch (error) {
    console.log(error);
  }
};

export const report = async (
  interaction: CommandInteraction,
  type: string,
  message: string
) => {
  const guild = interaction.guild as Guild;
  const channelResponse = await getChannel("report", guild);

  if (channelResponse.error) return;

  const reportChannel = channelResponse.data;

  const report = createEmbed(
    `📢 User Report!`,
    `**${interaction.user} submitted the following report in ${interaction.channel}:**\n"${message}"`
  )
    .setColor("Red")
    .setTimestamp()
    .addFields({
      name: "Report Type",
      value: type,
    });

  const roleResponse = await getRole("officer", guild);

  const officerRole = !roleResponse.error && roleResponse.data;

  const content = officerRole ? `${officerRole}` : "";

  try {
    reportChannel.send({
      embeds: [report],
      content,
    });
  } catch (error) {
    console.log(error);
  }
};

export const log = async (
  title: string,
  body: string,
  color: ColorResolvable,
  guild: Guild
) => {
  const message = createEmbed(title, body).setColor(color).setTimestamp();

  const channelResponse = await getChannel("log", guild);

  if (channelResponse.error) return;

  const logChannel = channelResponse.data;

  try {
    logChannel.send({ embeds: [message] });
  } catch (error) {
    console.log(error);
  }
};

export const sendError = async (
  errorTitle: string,
  errorMessage: string,

  interaction: CommandInteraction | ButtonInteraction

) => {
  const errorEmbed = createEmbed(errorTitle, errorMessage).setColor("Red");
  await interaction.editReply({ embeds: [errorEmbed] });
};
