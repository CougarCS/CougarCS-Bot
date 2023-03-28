import {
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
  ContactUpdate,
  SupabaseResponse,
} from "../../utils/types";
import { contactFields } from "../../utils/embedFields";

const sendError = async (
  errorMessage: string,
  interaction: CommandInteraction
) => {
  const errorEmbed = createEmbeded(
    "❌ Create Failed!",
    errorMessage,
    interaction.client
  ).setColor("Red");
  await interaction.editReply({ embeds: [errorEmbed] });
};

export const createcontact: Command = {
  data: new SlashCommandBuilder()
    .setName("createcontact")
    .setDescription("Add a contact to the database!")
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
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("firstname")
        .setDescription("The contact's first name!")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("lastname")
        .setDescription("The contact's last name!")
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User who's contact you would like to update!")
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

    const create: ContactInsert = {
      uh_id: interaction.options.get("psid", true).value as number,
      email: interaction.options.get("email", true).value as string,
      discord_snowflake: interaction.options.get("user", false)?.user?.id as
        | string
        | undefined,
      first_name: interaction.options.get("firstname", true).value as string,
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
      { name: "psid", value: `${create.uh_id}` },
      { name: "email", value: `${create.email}` },
      { name: "user", value: `<@${create.discord_snowflake}>` },
      { name: "firstname", value: `${create.first_name}` },
      { name: "lastname", value: `${create.last_name}` },
      { name: "phone", value: `${create.phone_number}` },
      { name: "shirtsize", value: `${create.shirt_size_id}` },
    ]);

    const contactResponse = await insertContact(create);

    if (contactResponse.error) {
      await sendError(contactResponse.message, interaction);
      return;
    }

    const returnMessage = createEmbeded(
      "✅ Contact Created!",
      "The contact has been inserted in the database!",
      client
    ).setColor("Green");

    const newContact = contactResponse.data[0];
    const newContactMessage = createEmbeded("👤 New Contact!", " ", client)
      .setColor("Yellow")
      .addFields(...contactFields(newContact));

    await interaction.editReply({ embeds: [returnMessage, newContactMessage] });
    return;
  },
};
