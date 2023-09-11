import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { getContactId, updateContact } from "../../utils/supabase";
import { shirtSizeOptions } from "../../utils/options";
import { ContactUpdate } from "../../utils/types";
import { contactFields } from "../../utils/embedFields";

export const updateProfile: Command = {
  data: new SlashCommandBuilder()
    .setName("update-profile")
    .setDescription("Update your CougarCS profile!")
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("Your preferred email address!")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("first-name")
        .setDescription("Your first name!")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("last-name")
        .setDescription("Your last name!")
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("phone")
        .setDescription("Your phone number!")
        .setRequired(false)
        .setMinValue(1000000000)
        .setMaxValue(9999999999)
    )
    .addStringOption((option) => {
      shirtSizeOptions().then((sizes) => option.setChoices(...sizes));
      return option
        .setName("shirt-size")
        .setDescription("The contact's shirt size!")
        .setRequired(false);
    }),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const { user } = interaction;

    const update: ContactUpdate = {
      email: interaction.options.get("email", false)?.value as
        | string
        | undefined,
      first_name: interaction.options.get("first-name", false)?.value as
        | string
        | undefined,
      last_name: interaction.options.get("last-name", false)?.value as
        | string
        | undefined,
      phone_number: interaction.options.get("phone", false)?.value as
        | number
        | undefined,
      shirt_size_id: interaction.options.get("shirt-size", false)?.value as
        | string
        | undefined,
    };

    commandLog(interaction, "/update-profile", "Purple", [
      { name: "email", value: `${update.email}` },
      { name: "firstname", value: `${update.first_name}` },
      { name: "lastname", value: `${update.last_name}` },
      { name: "phone", value: `${update.phone_number}` },
      { name: "shirtsize", value: `${update.shirt_size_id}` },
    ]);

    const errorTitle = "❌ Update Profile Failed!";

    const noParams = !(
      update.email ||
      update.first_name ||
      update.last_name ||
      update.phone_number ||
      update.shirt_size_id
    );

    if (noParams) {
      await sendError(
        errorTitle,
        "You must specify at least one property to be updated!",
        interaction
      );
      return;
    }

    const contactIdResponse = await getContactId({
      discord_snowflake: user.id,
    });

    if (contactIdResponse.error) {
      sendError(
        errorTitle,
        "Your contact could not be found! Please use /create-profile to create a new CougarCS profile!",
        interaction
      );
      return;
    }

    const contact_id = contactIdResponse.data;

    const contactResponse = await updateContact(update, contact_id);

    if (contactResponse.error) {
      sendError(
        errorTitle,
        "Your profile could not be updated! Contact an officer if you need help!",
        interaction
      );
      return;
    }

    const newContact = contactResponse.data;

    const returnMessage = createEmbed("👤 Profile Updated!", " ")
      .setColor("Purple")
      .addFields(...contactFields(newContact));

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
