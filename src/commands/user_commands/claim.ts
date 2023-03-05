import { Guild, GuildMember, Role, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import {
  SupabaseResponse,
  getContact,
  isMember,
  updateDiscordSnowflake,
} from "../../utils/supabase";

export const claim: Command = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim your CougarCS Member role!")
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription("Your UH issued PSID number (7 digit id)!")
        .setRequired(false)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription(
          "The email that you used to purchase a CougarCS membership!"
        )
        .setRequired(false)
    ),

  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: true });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const uh_id = interaction.options.get("psid", false)?.value as number;
    const email = interaction.options.get("email", false)?.value as string;

    commandLog(interaction, "/claim", "Green", [
      { name: "psid", value: `${uh_id}` },
      { name: "email", value: `${email}` },
    ]);

    const member = guild.members.cache.find(
      (gm) => user.id === gm.id
    ) as GuildMember;

    let memberRole = interaction.guild?.roles.cache.find(
      (r) => r.name === "Member"
    );

    if (!memberRole) {
      memberRole = (await guild.roles.create({
        color: "Blue",
        name: "Member",
      })) as Role;
    }

    if (member.roles.cache.find((r) => r === memberRole)) {
      const returnMessage = createEmbeded(
        "✅ Membership Confirmed!",
        `You still have the ${memberRole} role!`,
        client
      ).setColor("Green");
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const discord_snowflake = user.id;
    let contactResponse: SupabaseResponse;

    if (uh_id && email) {
      contactResponse = await getContact({ uh_id, email });
    } else {
      contactResponse = await getContact({ discord_snowflake });
    }

    if (contactResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Claim Failed!",
        `${contactResponse.message}\nYou must purchase a membership from https://cougarcs.com before claiming it!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const contact = contactResponse.data[0];
    const { contact_id } = contact;
    const memberResponse = await isMember({ contact_id });

    if (memberResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Claim Failed!",
        `${memberResponse.message}\nYou must purchase a membership from https://cougarcs.com before claiming it!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const activeMember = memberResponse.data[0];

    if (!activeMember) {
      const errorMessage = createEmbeded(
        "❌ Claim Failed!",
        `You do not have an active membership!\nYou must purchase a membership from https://cougarcs.com before claiming it!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    let updateResponse = { error: false };

    if (!contact.discord_snowflake) {
      updateResponse = await updateDiscordSnowflake(
        { contact_id },
        discord_snowflake
      );
    }

    if (updateResponse.error) {
      const errorMessage = createEmbeded(
        "❌ Claim Failed!",
        `Discord account could not be linked to contact!\nIf you think this is an error, please use /report to notify an officer!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    if (
      discord_snowflake !== contact.discord_snowflake &&
      contact.discord_snowflake
    ) {
      const errorMessage = createEmbeded(
        "❌ Claim Failed!",
        `This membership has already been claimed by <@${contact.discord_snowflake}>\nIf you think this is an error, please use /report to notify an officer!`,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    await member.roles.add(memberRole);

    const returnMessage = createEmbeded(
      "✅ Membership Claimed!",
      `The ${memberRole} role has been applied!`,
      client
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
