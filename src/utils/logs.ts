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

export const log = async (
  interaction: CommandInteraction,
  commandName: string,
  color: ColorResolvable,
  client: Client<boolean>,
  params: { name: string; value: string }[]
) => {
  const guild = interaction.guild as Guild;
  let logChannel = guild.channels.cache.find((c) => c.name === "cougarcs-logs");
  const officerRole = guild.roles.cache.find(
    (r) => r.name === "Officer"
  ) as Role;
  if (!logChannel) {
    logChannel = (await guild.channels.create({
      name: "cougarcs-logs",
      permissionOverwrites: [
        {
          id: guild.id,
          deny: "ViewChannel",
        },
        {
          id: officerRole.id,
          allow: "ViewChannel",
        },
      ],
      type: ChannelType.GuildText,
    })) as GuildBasedChannel;
    guild.channels.fetch();
  }
  logChannel = logChannel as TextChannel;

  let fullCommand = commandName;
  params.forEach((p) => {
    fullCommand = `${fullCommand} \`${p.name}:\`${p.value}`;
  });

  const message = createEmbeded(
    `Log ${commandName}`,
    `${interaction.user} used **${commandName}** in ${interaction.channel}`,
    interaction.user,
    client
  )
    .setColor(color)
    .setFooter(null)
    .addFields({
      name: "Full Command",
      value: `${fullCommand}`,
    });

  console.log(interaction);
  logChannel.send({ embeds: [message] });
};
