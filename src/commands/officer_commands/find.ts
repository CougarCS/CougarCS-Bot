import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded, sendBulkEmbeds } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getBalance, getContacts, isMember } from "../../utils/supabase";
import { EmbedBuilder } from "@discordjs/builders";
import { fullContactFields } from "../../utils/embedFields";
import { ContactQuery } from "src/utils/types";

export const find: Command = {
  data: new SlashCommandBuilder()
    .setName("find")
    .setDescription("Find a CougarCS contact from the database!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription("UH issued PSID number (7 digit id)!")
        .setRequired(false)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("firstname")
        .setDescription("The contact's first name!")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("lastname")
        .setDescription("The contact's last name!")
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName("discord")
        .setDescription("Discord user you wish to look for!")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("The email used to purchase a CougarCS membership!")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("seefullcontact")
        .setDescription(
          "Indicate if you would like the entire contact's details!"
        )
        .setRequired(false)
    ),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const psid = interaction.options.get("psid", false)?.value as
      | number
      | undefined;
    const email = interaction.options.get("email", false)?.value as
      | string
      | undefined;
    const first_name = interaction.options.get("firstname", false)?.value as
      | string
      | undefined;
    const last_name = interaction.options.get("lastname", false)?.value as
      | string
      | undefined;
    const discord_snowflake = interaction.options.get("discord", false)?.user
      ?.id as string | undefined;
    const fullprofile = interaction.options.get("seefullcontact", false)
      ?.value as boolean | undefined;

    commandLog(interaction, "/find", "Green", [
      { name: "psid", value: `${psid}` },
      { name: "email", value: `${email}` },
      { name: "firstname", value: `${first_name}` },
      { name: "lastname", value: `${last_name}` },
      {
        name: "discord",
        value: `${discord_snowflake}`,
      },
      { name: "seefullcontact", value: `${fullprofile}` },
    ]);

    const noParams = !(
      psid ||
      email ||
      first_name ||
      last_name ||
      discord_snowflake ||
      fullprofile
    );

    if (noParams) {
      const returnMessage = createEmbeded(
        "❌ Search canceled!",
        "No search parameters specified!",
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const query: ContactQuery = {
      uh_id: psid,
      email,
      first_name,
      last_name,
      discord_snowflake,
    };

    const contactsResponse = await getContacts(query);

    if (contactsResponse.error) {
      const returnMessage = createEmbeded(
        `🔎 Found 0 results!`,
        " ",
        client
      ).setColor("Red");
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const contacts = contactsResponse.data;
    const contactCount = contacts.length;
    const suffix = contactCount === 1 ? "" : "s";
    const embeds = [];

    const returnMessage = createEmbeded(
      `🔎 Found ${contactCount} result${suffix}:`,
      " ",
      client
    ).setColor("Yellow");
    embeds.push(returnMessage);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const { contact_id } = contact;
      const memberResponse = await isMember({ contact_id });
      const activeMember = !memberResponse.error && memberResponse.data[0];

      if (!fullprofile) {
        const embed = createEmbeded(
          `${contact.first_name} ${contact.last_name} (${contact.uh_id})`,
          `Member: ${activeMember ? "✅" : "❌"}`,
          client
        ).setColor("Green");
        embeds.push(embed);
        continue;
      }

      const discord = contact.discord_snowflake
        ? `<@${contact.discord_snowflake}>`
        : "null";
      const balanceResponse = await getBalance({ contact_id });
      let balance = 0;

      if (!balanceResponse.error) {
        balance = balanceResponse.data[0];
      }

      const embed = createEmbeded(" ", " ", client).addFields(
        ...fullContactFields(contact, balance, activeMember)
      );
      embeds.push(embed);
    }

    await sendBulkEmbeds(interaction, embeds);
    return;
  },
};
