import { Message, Role } from "discord.js";

export const ReactionRoleGiver = async (
  message: Message<true>,
  emojiRoles: { emoji: string; role: string }[]
) => {
  for (let i = 0; i < emojiRoles.length; i++) {
    const { emoji } = emojiRoles[i];
    try {
      await message.react(emoji || "❓");
    } catch (e) {}
  }

  const collector = message.createReactionCollector();
  collector.options.dispose = true;

  collector.on("collect", async (reaction, user) => {
    const emoji = reaction.emoji.name;
    if (!reaction.emoji.name) return;

    const roleName = emojiRoles.find(
      (er) => er.emoji === emoji || er.emoji.includes(`:${emoji}:`)
    )?.role;
    if (!roleName) return;

    await message.guild.roles.fetch();
    let role = message.guild.roles.cache.find((r) => r.name === roleName);

    if (!role) {
      role = (await message.guild.roles.create({ name: roleName })) as Role;
    }

    const member = await message.guild.members.fetch({ user });
    member.roles.add(role);
  });

  collector.on("remove", async (reaction, user) => {
    const emoji = reaction.emoji.name;
    if (!reaction.emoji.name) return;

    const roleName = emojiRoles.find(
      (er) => er.emoji === emoji || er.emoji.includes(`:${emoji}:`)
    )?.role;
    if (!roleName) return;

    await message.guild.roles.fetch();
    let role = message.guild.roles.cache.find((r) => r.name === roleName);

    if (!role) return;

    const member = await message.guild.members.fetch({ user });
    member.roles.remove(role);
  });
};
