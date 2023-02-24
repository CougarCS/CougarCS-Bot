import { EmbedBuilder } from "@discordjs/builders";
import {
  ChannelType,
  Client,
  ColorResolvable,
  CommandInteraction,
  Role,
  TextChannel,
  User,
} from "discord.js";
import { GuildBasedChannel } from "discord.js";
import { Guild } from "discord.js";
import { createEmbeded } from "./embeded";

const getOfficerRole = async (guild: Guild) => {
  let officerRole = guild.roles.cache.find((r) => r.name === "Officer");
  if (!officerRole) {
    officerRole = (await guild.roles.create({
      color: "Red",
      name: "Officer",
      position: 1,
      permissions: ["ManageChannels"],
    })) as Role;
  }
  return officerRole;
};

const getLogChannel = async (guild: Guild) => {
  let logChannel = guild.channels.cache.find((c) => c.name === "cougarcs-logs");
  if (!logChannel) {
    logChannel = await guild.channels.create({
      name: "cougarcs-logs",
      permissionOverwrites: [
        {
          id: guild.id,
          deny: "ViewChannel",
        },
        {
          id: (await getOfficerRole(guild)).id,
          allow: "ViewChannel",
        },
      ],
      type: ChannelType.GuildText,
    });
  }
  return logChannel as TextChannel;
};

const getReportChannel = async (guild: Guild) => {
  let logChannel = guild.channels.cache.find(
    (c) => c.name === "cougarcs-reports"
  );
  if (!logChannel) {
    logChannel = await guild.channels.create({
      name: "cougarcs-reports",
      permissionOverwrites: [
        {
          id: guild.id,
          deny: "ViewChannel",
        },
        {
          id: (await getOfficerRole(guild)).id,
          allow: "ViewChannel",
        },
      ],
      type: ChannelType.GuildText,
    });
  }
  return logChannel as TextChannel;
};

export const commandLog = async (
  interaction: CommandInteraction,
  commandName: string,
  color: ColorResolvable,
  params: { name: string; value: string }[]
) => {
  const guild = interaction.guild as Guild;
  const logChannel = await getLogChannel(guild);

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
    .setFooter(null)
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
  const logChannel = await getReportChannel(guild);

  const report = createEmbeded(
    `📢 User Report!`,
    `**${interaction.user} submitted the following report in ${interaction.channel}:**\n"${message}"`,
    interaction.client
  )
    .setColor("Red")
    .setFooter(null)
    .addFields({
      name: "Report Type",
      value: type,
    });

  logChannel.send({
    embeds: [report],
    content: `${await getOfficerRole(guild)}`,
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
    .setFooter(null);
  const logChannel = await getLogChannel(guild);
  await logChannel.send({ embeds: [message] });
};
