import { Guild, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed, sendBulkEmbeds } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import {
  getBalance,
  getContacts,
  getRole,
  isMember,
} from "../../utils/supabase";
import { EmbedBuilder } from "@discordjs/builders";
import { fullContactFields } from "../../utils/embedFields";
import { ContactQuery, ContactSelect } from "src/utils/types";

const createContactEmbeds = async (
  contacts: ContactSelect[],
  fullprofile: boolean,
  isAdmin?: boolean
): Promise<EmbedBuilder[]> => {
  const embeds: EmbedBuilder[] = [];
  const contactCount = contacts.length;
  const suffix = contactCount === 1 ? "" : "s";

  const returnMessage = createEmbed(
    `🔎 Found ${contactCount} result${suffix}:`,
    " "
  ).setColor("Yellow");
  embeds.push(returnMessage);

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const { contact_id } = contact;
    const memberResponse = await isMember({ contact_id });
    const activeMember = !memberResponse.error && memberResponse.data;

    if (!fullprofile) {
      const embed = createEmbed(
        `${contact.first_name} ${contact.last_name} (${contact.uh_id})`,
        `Member: ${activeMember ? "✅" : "❌"}`
      ).setColor("Green");
      embeds.push(embed);
      continue;
    }

    const balanceResponse = await getBalance({ contact_id });
    let balance = 0;

    if (!balanceResponse.error) {
      balance = balanceResponse.data;
    }

    const embed = createEmbed(" ", " ").addFields(
      ...fullContactFields(contact, balance, activeMember, isAdmin)
    );
    embeds.push(embed);
  }
  return embeds;
};

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
        .setName("reveal")
        .setDescription(
          "Indicate if you would like thsi command to be non-ephemeral"
        )
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
  run: async (interaction) => {
    const ephemeral = !interaction.options.get("reveal", false)?.value as
      | boolean;

    await interaction.deferReply({ ephemeral });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const query: ContactQuery = {
      uh_id: interaction.options.get("psid", false)?.value as
        | number
        | undefined,
      email: interaction.options.get("email", false)?.value as
        | string
        | undefined,
      first_name: interaction.options.get("firstname", false)?.value as
        | string
        | undefined,
      last_name: interaction.options.get("lastname", false)?.value as
        | string
        | undefined,
      discord_snowflake: interaction.options.get("discord", false)?.user?.id as
        | string
        | undefined,
    };
    const fullprofile = interaction.options.get("seefullcontact", false)
      ?.value as boolean | undefined;

    commandLog(interaction, "/find", "Green", [
      { name: "psid", value: `${query.uh_id}` },
      { name: "email", value: `${query.email}` },
      { name: "firstname", value: `${query.first_name}` },
      { name: "lastname", value: `${query.last_name}` },
      {
        name: "discord",
        value: `${query.discord_snowflake}`,
      },
      { name: "seefullcontact", value: `${fullprofile}` },
    ]);

    const errorTitle = "❌ Search Canceled!";

    const noParams = !(
      query.uh_id ||
      query.email ||
      query.first_name ||
      query.last_name ||
      query.discord_snowflake
    );

    if (noParams) {
      await sendError(
        errorTitle,
        "No search parameters specified!",
        interaction
      );
      return;
    }

    const contactsResponse = await getContacts(query);

    if (contactsResponse.error) {
      const returnMessage = createEmbed(`🔎 Found 0 results!`, " ").setColor(
        "Red"
      );
      await interaction.editReply({ embeds: [returnMessage] });
      return;
    }

    const contacts = contactsResponse.data as ContactSelect[];

    const member = await guild.members.fetch({ user });
    const adminRoleResponse = await getRole("admin", guild);

    let isAdmin = false;

    if (!adminRoleResponse.error) {
      const adminRole = adminRoleResponse.data;
      isAdmin = !!member.roles.cache.find((r) => r === adminRole);
    }

    const embeds = await createContactEmbeds(contacts, !!fullprofile, isAdmin);

    await sendBulkEmbeds(interaction, embeds);
    return;
  },
};
