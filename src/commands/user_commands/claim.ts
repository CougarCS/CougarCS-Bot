import { GuildMember, Role, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import {
  addSnowflake,
  findMember,
  findMemberWithSnowflake,
} from "../../utils/supabase";
import { commandLog } from "../../utils/logs";

export const claim: Command = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim your CougarCS Member role!")
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription("Your UH issued PSID number. (7 digit id)")
        .setRequired(false)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription(
          "The email that you used to purchase a CougarCS membership."
        )
        .setRequired(false)
    ),

  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: true });
    const { user } = interaction;
    const psid = interaction.options.get("psid", false);
    const email = interaction.options.get("email", false);
    commandLog(interaction, "/claim", "Green", [
      { name: "psid", value: `${psid}` },
      { name: "email", value: `${email}` },
    ]);
    const member = interaction.guild?.members.cache.find(
      (gm) => user.id === gm.id
    ) as GuildMember;
    let memberRole = interaction.guild?.roles.cache.find(
      (r) => r.name === "Member"
    );
    if (!memberRole) {
      memberRole = (await interaction.guild?.roles.create({
        color: "Blue",
        name: "Member",
      })) as Role;
    }

    if (member.roles.cache.find((r) => r === memberRole)) {
      const returnMessage = createEmbeded(
        "✅ Membership Confirmed!",
        `You still have the ${memberRole} role!`,
        client
      )
        .setColor("Green")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    let body = "";

    let membership = {} as {
      status: "success" | "failure";
      message: string;
      contact: any;
    };
    if (psid && email && psid.value && email.value) {
      membership = await findMember(
        psid.value as number,
        email.value as string
      );
    } else {
      membership = await findMemberWithSnowflake(user.id as string);
    }

    if (membership.status === "failure") {
      const returnMessage = createEmbeded(
        "❌ Claim Failed!",
        membership.message,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }
    const discord_snowflake = membership.contact.discord_snowflake;
    if (
      !discord_snowflake ||
      (discord_snowflake as string) === (user.id as string)
    ) {
      if (!discord_snowflake) {
        const response = await addSnowflake(
          membership.contact.contact_id as string,
          user.id
        );
        if (response.error) {
          const returnMessage = createEmbeded(
            "❌ Claim Failed!",
            "Could not link Discord account to CougarCS contact.",
            client
          )
            .setColor("Red")
            .setFooter(null)
            .setTimestamp(null);
          await interaction.editReply({ embeds: [returnMessage] });
          return;
        }
      }
      await member.roles.add(memberRole);
      const returnMessage = createEmbeded(
        "✅ Membership Claimed!",
        `The ${memberRole} role has been applied!`,
        client
      )
        .setColor("Green")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }
    await interaction.guild?.members.fetch();
    const otherMember = interaction.guild?.members.cache.find((gm) => {
      return (gm.id as string) === (discord_snowflake as string);
    });

    const returnMessage = createEmbeded(
      "❌ Claim Failed!",
      `This membership has already been claimed by ${otherMember}`,
      client
    )
      .setColor("Red")
      .setFooter(null)
      .setTimestamp(null);
    await interaction.editReply({ embeds: [returnMessage] });

    return;
  },
};
