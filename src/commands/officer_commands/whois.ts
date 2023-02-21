import { Guild, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import {
  findContactWithSnowflake,
  findMemberWithContactID,
  findMemberWithSnowflake,
  getBalance,
} from "../../utils/supabase";
import { log } from "../../utils/logs";

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
    const whoUser = interaction.options.get("user", true);
    log(interaction, "/whois", "Blue", client, [
      { name: "user", value: `${whoUser.user}` },
    ]);

    if (!whoUser.user) {
      return;
    }

    const contactFetch = await findContactWithSnowflake(whoUser.user.id);

    if (contactFetch.status === "failure") {
      const returnMessage = createEmbeded(
        "❌ Contact Not Found!",
        contactFetch.message,
        user,
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const membership = await findMemberWithContactID(
      contactFetch.contact.contact_id
    );

    const coin = await getBalance(whoUser.user.id);

    const returnMessage = createEmbeded("👤 Contact Found!", " ", user, client)
      .setColor("Blue")
      .setFooter(null)
      .setTimestamp(null)
      .addFields(
        { name: "Discord", value: `<@${whoUser.user.id}>`, inline: true },
        {
          name: "Status",
          value: membership.status === "success" ? "Member" : "Non-member",
          inline: true,
        },
        {
          name: "CougarCoin",
          value:
            membership.status === "success"
              ? `${(await getBalance(whoUser.user.id)).balance || 0}`
              : "0",
          inline: true,
        }
      )
      .setThumbnail(whoUser.user.displayAvatarURL())
      .addFields(
        {
          name: "First Name",
          value: contactFetch.contact.first_name,
          inline: true,
        },
        {
          name: "Last Name",
          value: contactFetch.contact.last_name,
          inline: true,
        },
        {
          name: "PSID",
          value: `${contactFetch.contact.uh_id}`,
          inline: true,
        }
      )
      .addFields(
        {
          name: "Email",
          value: contactFetch.contact.email,
          inline: true,
        },
        {
          name: "Phone Number",
          value: `${contactFetch.contact.phone_number}`,
          inline: true,
        },
        {
          name: "Shirt Size",
          value: `${contactFetch.contact.shirt_size_id}`,
          inline: true,
        }
      )
      .addFields(
        {
          name: "Contact ID",
          value: contactFetch.contact.contact_id,
          inline: true,
        },
        {
          name: "Date Added",
          value: new Date(contactFetch.contact.timestamp).toUTCString(),
          inline: true,
        }
      );

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
