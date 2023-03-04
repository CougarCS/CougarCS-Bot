import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { findContacts, getBalance, isMember } from "../../utils/supabase";
import { EmbedBuilder } from "@discordjs/builders";

export const find: Command = {
  data: new SlashCommandBuilder()
    .setName("find")
    .setDescription("Find a CougarCS contact from the database!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription("UH issued PSID number. (7 digit id)")
        .setRequired(false)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("The email used to purchase a CougarCS membership.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("firstname")
        .setDescription("The contact's first name.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("lastname")
        .setDescription("The contact's last name.")
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName("discord")
        .setDescription("Discord user you wish to look for.")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("seefullcontact")
        .setDescription(
          "Indicate if you would like the entire contact's details."
        )
        .setRequired(false)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const psid = interaction.options.get("psid", false);
    const email = interaction.options.get("email", false);
    const first_name = interaction.options.get("firstname", false);
    const last_name = interaction.options.get("lastname", false);
    const discord_snowflake = interaction.options.get("discord", false);
    const fullprofile = interaction.options.get("seefullcontact", false);

    commandLog(interaction, "/find", "Green", [
      { name: "psid", value: `${psid && psid.value}` },
      { name: "email", value: `${email && email.value}` },
      { name: "firstname", value: `${first_name && first_name.value}` },
      { name: "lastname", value: `${last_name && last_name.value}` },
      {
        name: "discord",
        value: `${discord_snowflake && discord_snowflake.user}`,
      },
      { name: "seefullcontact", value: `${fullprofile && fullprofile.value}` },
    ]);

    if (
      !(
        psid ||
        email ||
        first_name ||
        last_name ||
        discord_snowflake ||
        fullprofile
      )
    ) {
      const returnMessage = createEmbeded(
        "❌ Search canceled!",
        "No search parameters specified.",
        client
      )
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const contactsResponse = await findContacts({
      uh_id: psid ? (psid.value as number) : undefined,
      email: email ? (email.value as string) : undefined,
      first_name: first_name ? (first_name.value as string) : undefined,
      last_name: last_name ? (last_name.value as string) : undefined,
      discord_snowflake: discord_snowflake
        ? (discord_snowflake.user?.id as string)
        : undefined,
    });

    if (contactsResponse.status === "failure") {
      const returnMessage = createEmbeded(`🔎 Found 0 results!`, " ", client)
        .setColor("Red")
        .setFooter(null)
        .setTimestamp(null);
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const contacts = contactsResponse.contacts as any[];

    const embedGroups: EmbedBuilder[][] = [[]];
    const returnMessage = createEmbeded(
      `🔎 Found ${contacts.length} result${contacts.length === 1 ? "" : "s"}:`,
      " ",
      client
    )
      .setColor("Yellow")
      .setFooter(null)
      .setTimestamp(null);
    embedGroups[0].push(returnMessage);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      const membership = await isMember(contact.contact_id);

      const embed = createEmbeded(
        `${contact.first_name} ${contact.last_name} (${contact.uh_id})`,
        `Member: ${membership ? "✅" : "❌"}`,
        client
      )
        .setColor("Green")
        .setFooter(null)
        .setTimestamp(null);

      if (fullprofile && fullprofile.value) {
        embed
          .setDescription(" ")
          .addFields(
            {
              name: "Discord",
              value: contact.discord_snowflake
                ? `<@${contact.discord_snowflake}>`
                : "null",
              inline: true,
            },
            {
              name: "Member",
              value: membership ? "✅" : "❌",
              inline: true,
            },
            {
              name: "CougarCoin",
              value: "0",
              inline: true,
            }
          )
          .addFields(
            {
              name: "First Name",
              value: contact.first_name,
              inline: true,
            },
            {
              name: "Last Name",
              value: contact.last_name,
              inline: true,
            },
            {
              name: "PSID",
              value: `${contact.uh_id}`,
              inline: true,
            }
          )
          .addFields(
            {
              name: "Email",
              value: contact.email,
              inline: true,
            },
            {
              name: "Phone Number",
              value: `${contact.phone_number}`,
              inline: true,
            },
            {
              name: "Shirt Size",
              value: contact.shirt_size_id,
              inline: true,
            }
          )
          .addFields(
            {
              name: "Contact ID",
              value: contact.contact_id,
              inline: true,
            },
            {
              name: "Date Added",
              value: new Date(contact.timestamp).toUTCString(),
              inline: true,
            }
          );
      }

      embedGroups[embedGroups.length - 1].push(embed);
      if (embedGroups[embedGroups.length - 1].length === 10)
        embedGroups.push([]);
    }

    await interaction.editReply({ embeds: embedGroups[0] });

    for (let i = 1; i < embedGroups.length; i++) {
      await interaction.followUp({ embeds: embedGroups[i] });
    }

    return;
  },
};
