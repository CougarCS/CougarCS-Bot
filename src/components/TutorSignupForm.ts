import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  ComponentType,
  Message,
  ModalBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { TutorSignupFormData } from "../utils/types";
import { createEmbeded } from "../utils/embeded";

export default class TutorSignupForm {
  private formData: TutorSignupFormData = {
    name: "",
    psid: "",
    email: "",
    phoneNumber: "",
    reason: "",
    pronouns: [],
    classification: "",
    isCSMajor: "",
    lessThanBMinus: "",
    tutorType: [],
    coursesTutoring: [],
  };

  private lastMessage: Message | undefined;

  constructor(
    private commandInteraction: ChatInputCommandInteraction,
    private client: Client
  ) {
    const {
      modalButton,
      modal,
      formSubmitButton,
      onModalButton,
      onModalSubmit,
      onDropdownSubmit,
    } = this;

    client.on("interactionCreate", async (interaction) => {
      const isModalButton =
        interaction.isButton() &&
        modalButton.data.style === ButtonStyle.Primary &&
        interaction.customId === modalButton.data.custom_id;

      const isModalSubmit =
        interaction.isModalSubmit() &&
        interaction.customId === modal.data.custom_id;

      const isSelectMenu = interaction.isStringSelectMenu() && interaction;

      const isSubmitButton =
        interaction.isButton() &&
        formSubmitButton.data.style === ButtonStyle.Primary &&
        interaction.customId === formSubmitButton.data.custom_id;

      console.log(this.formData);

      if (isModalButton) {
        return await onModalButton(interaction);
      }

      if (isModalSubmit) {
        return await onModalSubmit(interaction);
      }

      if (isSelectMenu) {
        await onDropdownSubmit(interaction);
        return;
      }

      if (isSubmitButton) {
        // await onFormSubmit()
      }
    });
  }

  public sendForm = async () => {
    const { commandInteraction, wrapButtonActionRow, modalButton } = this;

    const startMessageEmbed = createEmbeded(
      "CougarCS Tutor Application!",
      "Click the button below to get started with your CougarCS Tutor Application!"
    );

    const modalButtonRow = wrapButtonActionRow(modalButton);

    await commandInteraction.reply({
      ephemeral: true,
      embeds: [startMessageEmbed],
      components: [modalButtonRow],
    });
  };

  private uniqueId = (baseId: string) => `${baseId}${new Date().getTime()}`;

  private dropdownIds = {
    pronouns: this.uniqueId("pronouns"),
    classification: this.uniqueId("classification"),
    isCSMajor: this.uniqueId("cs-major"),
    lessThanBMinus: this.uniqueId("b-minus"),
    tutorType: this.uniqueId("tutor-type"),
    coursesTutoring: this.uniqueId("courses"),
  };

  private wrapButtonActionRow = (
    input: ButtonBuilder
  ): ActionRowBuilder<ButtonBuilder> =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(input);

  private wrapInputActionRow = (
    input: TextInputBuilder
  ): ActionRowBuilder<TextInputBuilder> =>
    new ActionRowBuilder<TextInputBuilder>().addComponents(input);

  private wrapDropwdownActionRow = (
    dropdown: StringSelectMenuBuilder
  ): ActionRowBuilder<StringSelectMenuBuilder> =>
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dropdown);

  private modalButton = new ButtonBuilder()
    .setCustomId(this.uniqueId("modal-button"))
    .setLabel("Begin")
    .setStyle(ButtonStyle.Primary);

  private modal = new ModalBuilder()
    .setCustomId(this.uniqueId("modal"))
    .setTitle("CougarCS Tutor Signup")
    .setComponents(
      [
        new TextInputBuilder()
          .setCustomId(this.uniqueId("firstName"))
          .setPlaceholder("John Doe")
          .setLabel("Full Name")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setMinLength(5)
          .setMaxLength(30),
        new TextInputBuilder()
          .setCustomId(this.uniqueId("psid"))
          .setPlaceholder("xxxxxxx")
          .setLabel("PSID (7-digit student ID)")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setMinLength(7)
          .setMaxLength(7),
        new TextInputBuilder()
          .setCustomId(this.uniqueId("email"))
          .setPlaceholder("johndoe@email.com")
          .setLabel("Email")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50),
        new TextInputBuilder()
          .setCustomId(this.uniqueId("phoneNumber"))
          .setPlaceholder("xxx-xxx-xxxx")
          .setLabel("Phone Number")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setMinLength(10)
          .setMaxLength(20),
        new TextInputBuilder()
          .setCustomId(this.uniqueId("reason"))
          .setPlaceholder("I want to be a tutor because...")
          .setLabel("Reason For Application")
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500),
      ].map(this.wrapInputActionRow)
    );

  private pronouns = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.pronouns)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("He/Him")
        .setEmoji("👨")
        .setValue("he/him"),
      new StringSelectMenuOptionBuilder()
        .setLabel("She/Her")
        .setEmoji("👩")
        .setValue("she/her"),
      new StringSelectMenuOptionBuilder()
        .setLabel("They/Them")
        .setEmoji("🧑")
        .setValue("they/them"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Other")
        .setEmoji("🧑")
        .setValue("other")
    )
    .setMinValues(0)
    .setMaxValues(4)
    .setPlaceholder("What are your preferred pronouns?");

  private classification = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.classification)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Freshman")
        .setEmoji("🥚")
        .setValue("freshman"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Sophomore")
        .setEmoji("🐣")
        .setValue("sophomore"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Junior")
        .setEmoji("🐥")
        .setValue("Junior"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Senior")
        .setEmoji("🐔")
        .setValue("Senior")
    )
    .setMinValues(1)
    .setMaxValues(1)
    .setPlaceholder("What is your classification?");

  private isCSMajor = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.isCSMajor)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Yes")
        .setEmoji("✅")
        .setValue("yes"),
      new StringSelectMenuOptionBuilder()
        .setLabel("No")
        .setEmoji("❌")
        .setValue("no"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Undecided")
        .setEmoji("❔")
        .setValue("undecided")
    )
    .setMinValues(1)
    .setMaxValues(1)
    .setPlaceholder("Are you pursuing a CS degree?");

  private lessThanBMinus = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.lessThanBMinus)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Yes")
        .setEmoji("✅")
        .setValue("yes"),
      new StringSelectMenuOptionBuilder()
        .setLabel("No")
        .setEmoji("❌")
        .setValue("no")
    )
    .setMinValues(0)
    .setMaxValues(1)
    .setPlaceholder(
      "If so, did you receive less then a B- in one of your CS classes last semester?"
    );

  private tutorType = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.tutorType)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Online Tutor (Discord)")
        .setEmoji("💻")
        .setValue("online tutor"),
      new StringSelectMenuOptionBuilder()
        .setLabel("In Person Tutor")
        .setEmoji("🙋")
        .setValue("in person tutor")
    )
    .setMinValues(1)
    .setMaxValues(2)
    .setPlaceholder("What type of tutor would you want to be?");

  private coursesTutoring = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.coursesTutoring)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("COSC 1336")
        .setEmoji("🌱")
        .setValue("COSC 1336"),
      new StringSelectMenuOptionBuilder()
        .setLabel("COSC 1437")
        .setEmoji("🧱")
        .setValue("COSC 1437"),
      new StringSelectMenuOptionBuilder()
        .setLabel("COSC 2436")
        .setEmoji("🔗")
        .setValue("COSC 2436"),
      new StringSelectMenuOptionBuilder()
        .setLabel("COSC 2425")
        .setEmoji("💾")
        .setValue("COSC 2425"),
      new StringSelectMenuOptionBuilder()
        .setLabel("COSC 3320")
        .setEmoji("🧮")
        .setValue("COSC 3320"),
      new StringSelectMenuOptionBuilder()
        .setLabel("COSC 3360")
        .setEmoji("🗃️")
        .setValue("COSC 3360"),
      new StringSelectMenuOptionBuilder()
        .setLabel("COSC 1380")
        .setEmoji("📦")
        .setValue("COSC 1380"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Other")
        .setEmoji("❔")
        .setValue("Other")
    )
    .setMinValues(1)
    .setMaxValues(8)
    .setPlaceholder("What course(s) are you interested in tutoring in?");

  private formSubmitButton = new ButtonBuilder()
    .setCustomId(this.uniqueId("form-submit"))
    .setLabel("Submit")
    .setStyle(ButtonStyle.Primary);

  private additionalQuestions = [
    this.classification,
    this.tutorType,
    this.coursesTutoring,
    this.isCSMajor,
    this.lessThanBMinus,
    this.pronouns,
  ].map(this.wrapDropwdownActionRow);

  private onModalButton = async (interaction: ButtonInteraction) => {
    const { modal } = this;

    await interaction.showModal(modal);
  };

  private onModalSubmit = async (interaction: ModalSubmitInteraction) => {
    const {
      modalButton,
      commandInteraction,
      wrapButtonActionRow,
      formData,
      getInputValue,
      additionalQuestions,
      formSubmitButton,
    } = this;

    const additionalQuestionsEmbed = createEmbeded(
      "Additional Questions",
      "Please answer these additional questions to submit your tutoring application! If you need to change your previous responses, you can click the edit button above!"
    );

    const additionalQuestionsComponents = [
      ...additionalQuestions,
      wrapButtonActionRow(formSubmitButton),
    ];

    const aqcSplitA = additionalQuestionsComponents.slice(0, 4);
    const aqcSplitB = additionalQuestionsComponents.slice(4);

    await interaction.reply({
      ephemeral: true,
      embeds: [additionalQuestionsEmbed],
      components: aqcSplitA,
    });

    this.lastMessage = await interaction.followUp({
      ephemeral: true,
      components: aqcSplitB,
    });

    formData.name = getInputValue(interaction, 0);
    formData.psid = getInputValue(interaction, 1);
    formData.email = getInputValue(interaction, 2);
    formData.phoneNumber = getInputValue(interaction, 3);
    formData.reason = getInputValue(interaction, 4);

    modalButton.setLabel("Edit");

    await commandInteraction.editReply({
      components: [wrapButtonActionRow(modalButton)],
    });
  };

  private onDropdownSubmit = async (
    interaction: StringSelectMenuInteraction
  ) => {
    const { dropdownIds, formData, formSubmitButton } = this;

    await interaction.deferUpdate();

    switch (interaction.customId) {
      case dropdownIds.pronouns:
        formData.pronouns = interaction.values;
        break;
      case dropdownIds.classification:
        formData.classification = interaction.values[0];
        break;
      case dropdownIds.isCSMajor:
        formData.isCSMajor = interaction.values[0];
        break;
      case dropdownIds.lessThanBMinus:
        formData.lessThanBMinus = interaction.values[0] || "";
        break;
      case dropdownIds.tutorType:
        formData.tutorType = interaction.values;
        break;
      case dropdownIds.coursesTutoring:
        formData.coursesTutoring = interaction.values;
    }

    const { classification, isCSMajor, tutorType, coursesTutoring } = formData;

    const readyToSubmit = !!(
      classification &&
      isCSMajor &&
      tutorType.length > 0 &&
      coursesTutoring.length > 0
    );

    console.log(`Ready: ${readyToSubmit}`);

    if (readyToSubmit) {
      formSubmitButton.setDisabled(false);
    } else {
      formSubmitButton.setDisabled(true);
    }
  };

  private getInputValue = (
    interaction: ModalSubmitInteraction,
    index: number
  ): string => {
    const input = interaction.components[index].components[0];

    if (input.type === ComponentType.TextInput) {
      return input.value;
    }

    return "";
  };
}
