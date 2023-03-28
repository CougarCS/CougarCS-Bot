import {
  Client,
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import { commandLog } from "../../utils/logs";
import { getContact, insertContact, updateContact } from "../../utils/supabase";
import { EmbedBuilder } from "@discordjs/builders";
import { shirtSizeOptions } from "../../utils/options";
import {
  ContactInsert,
  ContactSelect,
  ContactUpdate,
  SupabaseResponse,
} from "../../utils/types";
import { contactFields } from "../../utils/embedFields";

const createUpdateEmbeds = (
  oldContact: ContactSelect,
  newContact: ContactSelect,
  client: Client
): EmbedBuilder[] => {
  const embeds: EmbedBuilder[] = [];

  const returnMessage = createEmbeded(
    "✅ Contact Updated!",
    "The contact information was updated!",
    client
  ).setColor("Green");
  embeds.push(returnMessage);

  const oldContactMessage = createEmbeded("👤 Old Contact!", " ", client)
    .setColor("Red")
    .addFields(...contactFields(oldContact));
  embeds.push(oldContactMessage);

  const newContactMessage = createEmbeded("👤 New Contact!", " ", client)
    .setColor("Blue")
    .addFields(...contactFields(newContact));

  embeds.push(newContactMessage);
  return embeds;
};

const sendError = async (
  errorMessage: string,
  interaction: CommandInteraction
) => {
  const errorEmbed = createEmbeded(
    "❌ Update Failed!",
    errorMessage,
    interaction.client
  ).setColor("Red");
  await interaction.editReply({ embeds: [errorEmbed] });
};

export const updatecontact: Command = {
  data: new SlashCommandBuilder()
    .setName("updatecontact")
    .setDescription("Update a contact in the database!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription("UH issued PSID number (7 digit id)! DOES NOT CHANGE!")
        .setRequired(true)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("The email used to purchase a CougarCS membership!")
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User who's contact you would like to update!")
        .setRequired(false)
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
    .addNumberOption((option) =>
      option
        .setName("phone")
        .setDescription("The contact's phone number!")
        .setRequired(false)
        .setMinValue(1000000000)
        .setMaxValue(9999999999)
    )
    .addStringOption((option) => {
      shirtSizeOptions().then((sizes) => option.setChoices(...sizes));
      return option
        .setName("shirtsize")
        .setDescription("The contact's shirt size!")
        .setRequired(false);
    }),
  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: false });
    const { user } = interaction;

    const update: ContactUpdate = {
      uh_id: interaction.options.get("psid", true).value as number,
      email: interaction.options.get("email", false)?.value as
        | string
        | undefined,
      discord_snowflake: interaction.options.get("user", false)?.user?.id as
        | string
        | undefined,
      first_name: interaction.options.get("firstname", false)?.value as
        | string
        | undefined,
      last_name: interaction.options.get("lastname", false)?.value as
        | string
        | undefined,
      phone_number: interaction.options.get("phone", false)?.value as
        | number
        | undefined,
      shirt_size_id: interaction.options.get("shirtsize", false)?.value as
        | string
        | undefined,
    };

    commandLog(interaction, "/updatecontact", "Green", [
      { name: "psid", value: `${update.uh_id}` },
      { name: "email", value: `${update.email}` },
      { name: "user", value: `<@${update.discord_snowflake}>` },
      { name: "firstname", value: `${update.first_name}` },
      { name: "lastname", value: `${update.last_name}` },
      { name: "phone", value: `${update.phone_number}` },
      { name: "shirtsize", value: `${update.shirt_size_id}` },
    ]);

    const oldContactResponse = await getContact({
      uh_id: update.uh_id as number,
    });

    if (oldContactResponse.error) {
      await sendError("PSID not found!", interaction);
      return;
    }

    const { contact_id } = oldContactResponse.data[0];

    const contactResponse = await updateContact(update, contact_id);

    if (contactResponse.error) {
      await sendError(contactResponse.message, interaction);
      return;
    }

    const oldContact = oldContactResponse.data[0];
    const newContact = contactResponse.data[0];
    const embeds = createUpdateEmbeds(oldContact, newContact, client);

    await interaction.editReply({ embeds });
    return;
  },
};
