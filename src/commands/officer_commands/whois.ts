import {
  Guild,
  PermissionFlagsBits,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { getBalance, getContact, isMember } from "../../utils/supabase";
import { commandLog } from "../../utils/logs";

export const whois: Command = {
  data: new SlashCommandBuilder()
    .setName("whois")
    .setDescription("Check the database for a Discord member!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User you wish to look for")
        .setRequired(true)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const whoUserOption = interaction.options.get("user", true);
    const whoUser = whoUserOption.user as User;

    commandLog(interaction, "/whois", "Blue", [
      { name: "user", value: `${whoUser}` },
    ]);

    const discord_snowflake = whoUser.id;
    const contactResponse = await getContact({ discord_snowflake });

    if (contactResponse.error) {
      const errorMessage = createEmbeded(
        "❌ WhoIs Failed!",
        contactResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const {
      contact_id,
      uh_id,
      email,
      first_name,
      last_name,
      phone_number,
      shirt_size_id,
      timestamp,
    } = contactResponse.data[0];
    const memberResponse = await isMember({ contact_id });

    if (memberResponse.error) {
      const errorMessage = createEmbeded(
        "❌ WhoIs Failed!",
        memberResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const activeMember = memberResponse.data[0];
    const balanceResponse = await getBalance({ contact_id });

    if (balanceResponse.error) {
      const errorMessage = createEmbeded(
        "❌ WhoIs Failed!",
        balanceResponse.message,
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const balance = balanceResponse.data[0];

    const returnMessage = createEmbeded("👤 Contact Found!", " ", client)
      .setColor("Blue")
      .addFields(
        { name: "Discord", value: `<@${discord_snowflake}>`, inline: true },
        {
          name: "Member",
          value: activeMember ? "✅" : "❌",
          inline: true,
        },
        {
          name: "CougarCoin",
          value: `**${balance}**`,
          inline: true,
        }
      )
      .setThumbnail(whoUser.displayAvatarURL())
      .addFields(
        {
          name: "First Name",
          value: `${first_name}`,
          inline: true,
        },
        {
          name: "Last Name",
          value: `${last_name}`,
          inline: true,
        },
        {
          name: "PSID",
          value: `${uh_id}`,
          inline: true,
        }
      )
      .addFields(
        {
          name: "Email",
          value: `${email}`,
          inline: true,
        },
        {
          name: "Phone Number",
          value: `${phone_number}`,
          inline: true,
        },
        {
          name: "Shirt Size",
          value: `${shirt_size_id}`,
          inline: true,
        }
      )
      .addFields(
        {
          name: "Contact ID",
          value: `${contact_id}`,
          inline: true,
        },
        {
          name: "Date Added",
          value: `${new Date(timestamp).toUTCString()}`,
          inline: true,
        }
      );

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
