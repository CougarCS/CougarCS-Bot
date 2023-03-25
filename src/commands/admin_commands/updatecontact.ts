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

export const updatecontact: Command = {
  data: new SlashCommandBuilder()
    .setName("updatecontact")
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

    const uh_id = interaction.options.get("psid", true).value as number;
    const email = interaction.options.get("email", false)?.value as
      | string
      | undefined;
    const discord_snowflake = interaction.options.get("user", false)?.user
      ?.id as string | undefined;
    const first_name = interaction.options.get("firstname", false)?.value as
      | string
      | undefined;
    const last_name = interaction.options.get("lastname", false)?.value as
      | string
      | undefined;
    const phone_number = interaction.options.get("phone", false)?.value as
      | number
      | undefined;
    const shirt_size_id = interaction.options.get("shirtsize", false)?.value as
      | string
      | undefined;

    commandLog(interaction, "/updatecontact", "Green", [
      { name: "psid", value: `${uh_id}` },
      { name: "email", value: `${email}` },
      { name: "user", value: `<@${discord_snowflake}>` },
      { name: "firstname", value: `${first_name}` },
      { name: "lastname", value: `${last_name}` },
      { name: "phone", value: `${phone_number}` },
      { name: "shirtsize", value: `${shirt_size_id}` },
    ]);

    const errorMessage = createEmbeded(
      "❌ Update Failed!",
      "There was an error performing this command!",
      client
    ).setColor("Red");

    const initialContactResponse = await getContact({ uh_id });
    let contact_id = undefined;

    if (!initialContactResponse.error) {
      contact_id = initialContactResponse.data[0].contact_id;
    }

    let contactResponse: SupabaseResponse;

    if (contact_id) {
      const update: ContactUpdate = {
        contact_id,
        uh_id,
        email,
        discord_snowflake,
        first_name,
        last_name,
        phone_number,
        shirt_size_id,
      };

      contactResponse = await updateContact(update, contact_id);
    } else if (email && first_name) {
      const insert: ContactInsert = {
        contact_id,
        uh_id,
        email,
        discord_snowflake,
        first_name,
        last_name,
        phone_number,
        shirt_size_id,
      };

      contactResponse = await insertContact(insert);
    } else {
      errorMessage.setDescription("Invalid Parameters!");
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    if (contactResponse.error) {
      errorMessage.setDescription(contactResponse.message);
      await interaction.editReply({ embeds: [errorMessage] });
      return;
    }

    const embeds: EmbedBuilder[] = [];

    const returnMessage = createEmbeded(
      "✅ Contact Updated!",
      "The contact information was updated!",
      client
    ).setColor("Green");
    embeds.push(returnMessage);

    if (contact_id && !initialContactResponse.error) {
      const initContact = initialContactResponse.data[0];
      const initialContactMessage = createEmbeded(
        "👤 Old Contact!",
        " ",
        client
      )
        .setColor("Purple")
        .addFields(...contactFields(initContact));
      embeds.push(initialContactMessage);
    }

    const newContact = contactResponse.data[0];
    const newContactMessage = createEmbeded("👤 New Contact!", " ", client)
      .setColor("Yellow")
      .addFields(...contactFields(newContact));

    embeds.push(newContactMessage);

    await interaction.editReply({ embeds });
    return;
  },
};
