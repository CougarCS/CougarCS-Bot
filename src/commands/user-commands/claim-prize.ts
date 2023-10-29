import { Guild, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import {
  getContact,
  getRole,
  isMember,
  updateContact,
} from "../../utils/supabase";
import { ContactSelect, SupabaseResponse } from "src/utils/types";

export const claimPrize: Command = {
  data: new SlashCommandBuilder()
    .setName("claim-prize")
    .setDescription("Claim your Cougar Coins!")
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription("Your UH issued PSID number (7 digit id)!")
        .setRequired(true)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription(
          "The email that you used to either purchase a current or past CougarCS membership!"
        )
        .setRequired(true)
    ),
    

  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const uh_id = interaction.options.get("psid", false)?.value as number;
    const email = interaction.options.get("email", false)?.value as string;

    commandLog(interaction, "/claim-prize", "Green", [
      { name: "psid", value: `${uh_id}` },
      { name: "email", value: `${email}` },
    ]);

    const errorTitle = "❌ Claim Prize Failed!";

    const reminderMsg =
      "You must purchase a membership from https://cougarcs.com/join before claiming it!";
    const reportMsg =
      "If you think this is an error, please use /report to notify an officer!";

    const member = await guild.members.fetch({ user });

    const roleResponse = await getRole("member", guild);

    if (roleResponse.error) {
      await sendError(errorTitle, roleResponse.message, interaction);
      return;
    }

    const memberRole = roleResponse.data;

    const haveMemberRole = !!member.roles.cache.find((r) => r === memberRole);

    // if (haveMemberRole) {
    //   const returnMessage = createEmbed(
    //     "✅ Membership Confirmed!",
    //     `You still have the ${memberRole} role!`
    //   ).setColor("Green");
    //   await interaction.editReply({ embeds: [returnMessage] });
    //   return;
    // }

    const discord_snowflake = user.id;
    let contactResponse: SupabaseResponse<ContactSelect>;

    contactResponse = await getContact({ uh_id, email });

    if (contactResponse.error) {
      await sendError(
        errorTitle,
        `${contactResponse.message}\n${reminderMsg}`,
        interaction
      );
      return;
    }

    const contact = contactResponse.data;
    const { contact_id } = contact;
    const memberResponse = await isMember({ contact_id });

    if (memberResponse.error) {
      await sendError(
        errorTitle,
        `${memberResponse.message}\n${reminderMsg}`,
        interaction
      );
      return;
    }

    const activeMember = memberResponse.data;

    if (!activeMember) {
      await sendError(
        errorTitle,
        `You do not have an active membership!\n${reminderMsg}`,
        interaction
      );
      return;
    }

    let updateResponse = { error: false };

    if (!contact.discord_snowflake) {
      updateResponse = await updateContact({ discord_snowflake }, contact_id);
    }

    if (updateResponse.error) {
      await sendError(
        errorTitle,
        `Discord account could not be linked!\n${reportMsg}`,
        interaction
      );
      return;
    }

    // const claimedByOtherUser =
    //   discord_snowflake !== contact.discord_snowflake &&
    //   contact.discord_snowflake;

    // if (claimedByOtherUser) {
    //   await sendError(
    //     errorTitle,
    //     `This membership has already been claimed by <@${contact.discord_snowflake}>\n${reportMsg}`,
    //     interaction
    //   );
    //   return;
    // }

    // await member.roles.add(memberRole);

    const returnMessage = createEmbed(
      "✅ Cougar Coins Claimed!",
      `Your Cougar Coins of [x] amount has been added to your /balance!`
    ).setColor("Green");
    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
