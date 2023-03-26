import { Guild, GuildMember, Role, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getContact, isMember, updateContact } from "../../utils/supabase";
import { SupabaseResponse } from "src/utils/types";

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

    const errorMessage = createEmbeded(
      "❌ Claim Failed!",
      "There was an error performing this command!",
      client
    ).setColor("Red");

    const reminderMsg =
      "You must purchase a membership from https://cougarcs.com before claiming it!";
    const reportMsg =
      "If you think this is an error, please use /report to notify an officer!";

    const member = await guild.members.fetch({ user });

    await guild.roles.fetch();
    let memberRole = guild.roles.cache.find((r) => r.name === "Member");

    if (!memberRole) {
      memberRole = (await guild.roles.create({
        color: "Blue",
        name: "Member",
      })) as Role;
    }

    const haveMemberRole = !!member.roles.cache.find((r) => r === memberRole);

    if (haveMemberRole) {
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
      errorMessage.setDescription(`${contactResponse.message}\n${reminderMsg}`);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const contact = contactResponse.data[0];
    const { contact_id } = contact;
    const memberResponse = await isMember({ contact_id });

    if (memberResponse.error) {
      errorMessage.setDescription(`${memberResponse.message}\n${reminderMsg}`);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const activeMember = memberResponse.data[0];

    if (!activeMember) {
      errorMessage.setDescription(
        `You do not have an active membership!\n${reminderMsg}`
      );
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    let updateResponse = { error: false };

    if (!contact.discord_snowflake) {
      updateResponse = await updateContact({ contact_id }, discord_snowflake);
    }

    if (updateResponse.error) {
      errorMessage.setDescription(
        `Discord account could not be linked!\n${reportMsg}`
      );
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const claimedByOtherUser =
      discord_snowflake !== contact.discord_snowflake &&
      contact.discord_snowflake;

    if (claimedByOtherUser) {
      errorMessage.setDescription(
        `This membership has already been claimed by <@${contact.discord_snowflake}>\n${reportMsg}`
      );
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
