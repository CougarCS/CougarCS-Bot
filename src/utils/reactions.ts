import { Message } from "discord.js";

export const languageIcons = [
  "<:CLang:1032539748113326134>",
  "<:CPP:1032539747089915976>",
  "<:CSharp:1032539746657910805>",
  "<:HTML:1032458844737122315>",
  "<:CSS:1032458840819630120>",
  "<:JavaScript:1032458843814367335>",
  "<:TypeScript:1032458841977270352>",
  "<:Python:1078735959736193074>",
  "<:PHP:1032539745886154812>",
  "<:Bash:1032543099861336095>",
  "<:RLang:1032539944150892564>",
  "<:Ruby:1032539744560746568>",
  "<:Scala:1032539742568468543>",
  "<:Rust:1032539743822565396>",
  "<:GO:1032539943043596339>",
];

export const languageNames = [
  "C",
  "C++",
  "C#",
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "Python",
  "PHP",
  "Bash",
  "R",
  "Ruby",
  "Scala",
  "Rust",
  "Go",
];

export const frameworkIcons = [
  "<:Angular:1032659006533160993>",
  "<:React:1032458843357192192>",
  "<:Nextjs:1076993068768690187>",
  "<:Bootstrap:1032659008139567158>",
  "<:Tailwind:1032659012837195827>",
  "<:ExpressJS:1032667384491819089>",
  "<:Django:1032667496479723643>",
  // "<:Firebase:1032659011226587187>",
  // "<:Nodejs:1032659015332794448>",
];

export const frameworkNames = [
  "Angular",
  "React",
  "Next.js",
  "Bootstrap",
  "Tailwind",
  "Express",
  "Django",
  // "Firebase",
  // "Node",
];

export const ReactionRoleGiver = async (
  message: Message<true>,
  emojis: string[]
) => {
  for (let i = 0; i < emojis.length - 1; i++) {
    message.react(emojis.at(i) || "❓");
  }
  message.react(emojis.at(emojis.length - 1) || "❓").then(() => {
    const collector = message.createReactionCollector();
    collector.options.dispose = true;
    collector.on("collect", async (reaction, user) => {
      if (!reaction.emoji.name) return;
      if (
        !message.guild.roles.cache.find((r) => r.name === reaction.emoji.name)
      ) {
        await message.guild.roles.create({ name: reaction.emoji.name });
      }
      await message.guild.roles.fetch();
      const role = message.guild.roles.cache.find(
        (r) => r.name === reaction.emoji.name
      );
      if (!role) return;
      message.guild.members.cache
        .find((g) => user.id === g.id)
        ?.roles.add(role);
    });

    collector.on("remove", (reaction, user) => {
      if (!reaction.emoji.name) return;
      if (
        !message.guild.roles.cache.find((r) => r.name === reaction.emoji.name)
      ) {
        message.guild.roles.create({ name: reaction.emoji.name });
      }
      const role = message.guild.roles.cache.find(
        (r) => r.name === reaction.emoji.name
      );
      if (!role) return;
      message.guild.members.cache
        .find((g) => user.id === g.id)
        ?.roles.remove(role);
    });
  });
};
