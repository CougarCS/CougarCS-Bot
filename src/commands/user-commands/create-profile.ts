import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbed } from "../../utils/embeded";
import { commandLog, sendError } from "../../utils/logs";
import { getContactId, insertContact } from "../../utils/supabase";
import { shirtSizeOptions } from "../../utils/options";
import { ContactInsert } from "../../utils/types";
import { contactFields } from "../../utils/embedFields";

export const createProfile: Command = {
  data: new SlashCommandBuilder()
    .setName("create-profile")
    .setDescription("Create a CougarCS profile!")
    .addNumberOption((option) =>
      option
        .setName("psid")
        .setDescription(
          "Your UH issued PSID number (7 digit id). This does not change!"
        )
        .setRequired(true)
        .setMaxValue(9999999)
        .setMinValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("Your preferred email!")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("first-name")
        .setDescription("Your first name!")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("last-name")
        .setDescription("Your last name!")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("phone")
        .setDescription("Your phone number!")
        .setRequired(true)
        .setMinValue(1000000000)
        .setMaxValue(9999999999)
    )
    .addStringOption((option) => {
      shirtSizeOptions().then((sizes) => option.setChoices(...sizes));
      return option
        .setName("shirt-size")
        .setDescription("Your shirt size!")
        .setRequired(true);
    }),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const { user } = interaction;

    const uh_id = interaction.options.get("psid", true).value as number;
    const email = interaction.options.get("email", true).value as string;

    const create: ContactInsert = {
      uh_id,
      email,
      discord_snowflake: user.id,
      first_name: interaction.options.get("first-name", true).value as string,
      last_name: interaction.options.get("last-name", true)?.value as
        | string
        | undefined,
      phone_number: interaction.options.get("phone", true)?.value as
        | number
        | undefined,
      shirt_size_id: interaction.options.get("shirt-size", true)?.value as
        | string
        | undefined,
    };

    commandLog(interaction, "/create-profile", "Purple", [
      { name: "psid", value: `${create.uh_id}` },
      { name: "email", value: `${create.email}` },
      { name: "first-name", value: `${create.first_name}` },
      { name: "last-name", value: `${create.last_name}` },
      { name: "phone", value: `${create.phone_number}` },
      { name: "shirt-size", value: `${create.shirt_size_id}` },
    ]);

    const errorTitle = "❌ Create Profile Failed!";

    const contactIdFromDiscordResponse = await getContactId({
      discord_snowflake: user.id,
    });

    if (!contactIdFromDiscordResponse.error) {
      sendError(
        errorTitle,
        "You already have a profile! Please use /update-profile to make any changes!",
        interaction
      );
      return;
    }

    const contactIdFromPSIDResponse = await getContactId({
      uh_id,
    });

    if (!contactIdFromPSIDResponse.error) {
      sendError(
        errorTitle,
        "That PSID is already associated with another profile! Contact an officer if you believe this is a mistake!",
        interaction
      );
      return;
    }

    const contactIdFromEmailResponse = await getContactId({
      email,
    });

    if (!contactIdFromEmailResponse.error) {
      sendError(
        errorTitle,
        "That email is already associated with another profile! Contact an officer if you believe this is a mistake!",
        interaction
      );
      return;
    }

    const contactResponse = await insertContact(create);

    if (contactResponse.error) {
      console.log(contactResponse.message);
      sendError(
        errorTitle,
        "Your profile could not be created! Contact an officer if you need help!",
        interaction
      );
      return;
    }

    const newContact = contactResponse.data;

    const returnMessage = createEmbed("👤 Profile Created!", " ")
      .setColor("Purple")
      .addFields(...contactFields(newContact));

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
