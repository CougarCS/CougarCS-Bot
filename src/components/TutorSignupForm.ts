import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  ComponentType,
  Guild,
  Interaction,
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
import { getChannel, getGuildData, getRole } from "../utils/supabase";

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
    threeCourseHours: "",
    passedCourses: "",
    tosAgreement: "",
  };

  private modalSubmitted = false;

  private submitted = false;

  private guild: Guild;

  private submitButtonOffered = false;

  private interactionListener = async (interaction: Interaction) => {
    const isModalButton =
      interaction.isButton() &&
      this.modalButton.data.style === ButtonStyle.Primary &&
      interaction.customId === this.modalButton.data.custom_id;

    const isModalSubmit =
      interaction.isModalSubmit() &&
      interaction.customId === this.modal.data.custom_id;

    const isSelectMenu = interaction.isStringSelectMenu() && interaction;

    const isSubmitButton =
      interaction.isButton() &&
      this.formSubmitButton.data.style === ButtonStyle.Primary &&
      interaction.customId === this.formSubmitButton.data.custom_id;

    const isAcceptButton =
      interaction.isButton() &&
      this.acceptTutorButton.data.style === ButtonStyle.Primary &&
      interaction.customId === this.acceptTutorButton.data.custom_id;

    const isRejectButton =
      interaction.isButton() &&
      this.rejectTutorButton.data.style === ButtonStyle.Danger &&
      interaction.customId === this.rejectTutorButton.data.custom_id;

    if (isModalButton) {
      await this.onModalButton(interaction);
      console.log(this.formData);
      return;
    }

    if (isModalSubmit) {
      await this.onModalSubmit(interaction);
      console.log(this.formData);
      return;
    }

    if (isSelectMenu) {
      await this.onDropdownSubmit(interaction);
      console.log(this.formData);
      return;
    }

    if (isSubmitButton) {
      console.log(this.formData);
      await this.onFormSubmit(interaction);
    }

    if (isAcceptButton) {
      console.log(this.formData);
      await this.onAcceptTutor(interaction);
    }

    if (isRejectButton) {
      console.log(this.formData);
      await this.onRejectTutor(interaction);
    }
  };

  private removeInteractionListener = () =>
    this.client.off("interactionCreate", this.interactionListener);

  constructor(
    private commandInteraction: ChatInputCommandInteraction,
    private client: Client
  ) {
    this.guild = commandInteraction.guild as Guild;
    client.on("interactionCreate", this.interactionListener);

    const oneDayInMs = 1000 * 60 * 60 * 24;
    setTimeout(() => {
      if (!this.submitted) {
        this.removeInteractionListener();
      }
    }, oneDayInMs);
  }

  public sendForm = async () => {
    const { commandInteraction, wrapButtonActionRow, modalButton } = this;

    await commandInteraction.deferReply({
      ephemeral: true,
    });

    const { user } = commandInteraction;

    const member = await this.guild.members.fetch({ user });

    const tutorRoleResponse = await getRole("tutor", this.guild);

    if (!tutorRoleResponse.error) {
      const tutorRole = tutorRoleResponse.data;
      if (member.roles.cache.find((r) => r === tutorRole)) {
        const returnMessage = createEmbeded(
          "❌ Tutor Signup Failed!",
          "You are already a tutor!"
        );

        await commandInteraction.editReply({
          embeds: [returnMessage],
        });

        this.removeInteractionListener();

        return;
      }
    }

    const startMessageEmbed = createEmbeded(
      "CougarCS Tutor Application!",
      "Click the button below to get started with your CougarCS Tutor Application!"
    );

    const modalButtonRow = wrapButtonActionRow(modalButton);

    await commandInteraction.editReply({
      embeds: [startMessageEmbed],
      components: [modalButtonRow],
    });
  };

  private isReadyToSubmit = () =>
    !!(
      this.formData.classification &&
      this.formData.isCSMajor &&
      this.formData.tutorType.length > 0 &&
      this.formData.coursesTutoring.length > 0 &&
      this.formData.threeCourseHours &&
      this.formData.passedCourses &&
      this.formData.tosAgreement
    );

  private uniqueId = (baseId: string) => `${baseId}${new Date().getTime()}`;

  private dropdownIds = {
    pronouns: this.uniqueId("pronouns"),
    classification: this.uniqueId("classification"),
    isCSMajor: this.uniqueId("cs-major"),
    lessThanBMinus: this.uniqueId("b-minus"),
    tutorType: this.uniqueId("tutor-type"),
    coursesTutoring: this.uniqueId("courses"),
    threeCourseHours: this.uniqueId("three-hours"),
    passedCourses: this.uniqueId("passed"),
    tosAgreement: this.uniqueId("tos"),
  };

  private wrapButtonActionRow = (
    ...input: ButtonBuilder[]
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
          .setPlaceholder(
            "(mentioning past experience, grades, and/or club participation may help you stand out)"
          )
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
    .setPlaceholder("What is your classification? *");

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
    .setPlaceholder("Are you pursuing a CS degree? *");

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
    .setPlaceholder("Yes/No");

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
    .setPlaceholder("What type of tutor would you want to be? *");

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
    .setPlaceholder("What course(s) are you interested in tutoring in? *");

  private threeCourseHours = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.threeCourseHours)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("I have completed 3+ hours of CS credit")
        .setEmoji("✅")
        .setValue("3+ Hours"),
      new StringSelectMenuOptionBuilder()
        .setLabel("I have not completed 3 hours of CS credit")
        .setEmoji("❌")
        .setValue("< 3 Hours")
    )
    .setPlaceholder(
      "Have you completed 3 or more hours of CS course credit? *"
    );

  private passedCourses = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.passedCourses)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("I've passed the course(s) I applied to tutor for")
        .setEmoji("✅")
        .setValue("Passed"),
      new StringSelectMenuOptionBuilder()
        .setLabel("I haven't passed the course(s) I applied to tutor for")
        .setEmoji("❌")
        .setValue("Not Passed")
    )
    .setPlaceholder(
      "Have you passed all the courses that you've applied for? *"
    );

  private tosAgreement = new StringSelectMenuBuilder()
    .setCustomId(this.dropdownIds.tosAgreement)
    .setOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("I will abide to the CougarCS TOS and Code of Conduct")
        .setEmoji("✅")
        .setValue("Passed")
    )
    .setMinValues(1)
    .setMaxValues(1)
    .setPlaceholder(
      "By submitting, you agree to abide by the CougarCS TOS and Code of Conduct. *"
    );

  private formSubmitButton = new ButtonBuilder()
    .setCustomId(this.uniqueId("form-submit"))
    .setLabel("Submit")
    .setStyle(ButtonStyle.Primary);

  private additionalQuestions = [
    this.pronouns,
    this.classification,
    this.tutorType,
    this.coursesTutoring,
    this.isCSMajor,
    this.lessThanBMinus,
    this.threeCourseHours,
    this.passedCourses,
    this.tosAgreement,
  ].map(this.wrapDropwdownActionRow);

  private onModalButton = async (interaction: ButtonInteraction) => {
    const { formData, modal, setInputValue } = this;

    if (formData.name) {
      setInputValue(0, formData.name);
      setInputValue(1, formData.psid);
      setInputValue(2, formData.email);
      setInputValue(3, formData.phoneNumber);
      setInputValue(4, formData.reason);
    }

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
    } = this;

    formData.name = getInputValue(interaction, 0);
    formData.psid = getInputValue(interaction, 1);
    formData.email = getInputValue(interaction, 2);
    formData.phoneNumber = getInputValue(interaction, 3);
    formData.reason = getInputValue(interaction, 4);

    if (this.modalSubmitted) {
      await interaction.deferUpdate();
      return;
    }

    this.modalSubmitted = true;

    const additionalQuestionsEmbed = createEmbeded(
      "Additional Questions",
      "Please answer these additional questions to submit your tutoring application! If you need to change your previous responses, you can click the edit button above!"
    );

    const lessThanBMinusEmbed = createEmbeded(
      " ",
      "If you answered 'yes' to the previous question, did you receive less than a B- in one of your CS classes last semester?"
    );

    const additionalQuestionsComponents = [...additionalQuestions];

    const aqcSplitA = additionalQuestionsComponents.slice(0, 5);
    const aqcSplitB = additionalQuestionsComponents.slice(5);

    await interaction.reply({
      ephemeral: true,
      embeds: [additionalQuestionsEmbed],
      components: aqcSplitA,
    });

    await interaction.followUp({
      ephemeral: true,
      embeds: [lessThanBMinusEmbed],
      components: aqcSplitB,
    });

    modalButton.setLabel("Edit");

    await commandInteraction.editReply({
      components: [wrapButtonActionRow(modalButton)],
    });
  };

  private onDropdownSubmit = async (
    interaction: StringSelectMenuInteraction
  ) => {
    const { dropdownIds, formData } = this;

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
        formData.lessThanBMinus =
          interaction.values[0] || formData.lessThanBMinus;
        break;
      case dropdownIds.tutorType:
        formData.tutorType = interaction.values;
        break;
      case dropdownIds.coursesTutoring:
        formData.coursesTutoring = interaction.values;
        break;
      case dropdownIds.threeCourseHours:
        formData.threeCourseHours =
          interaction.values[0] || formData.threeCourseHours;
        break;
      case dropdownIds.passedCourses:
        formData.passedCourses =
          interaction.values[0] || formData.passedCourses;
        break;
      case dropdownIds.tosAgreement:
        formData.tosAgreement = interaction.values[0] || formData.tosAgreement;
    }

    if (this.isReadyToSubmit() && !this.submitButtonOffered) {
      this.submitButtonOffered = true;
      this.commandInteraction.followUp({
        ephemeral: true,
        embeds: [
          createEmbeded(
            " ",
            "Please review your application and click submit when you are ready."
          ),
        ],
        components: [this.wrapButtonActionRow(this.formSubmitButton)],
      });
    }
  };

  private onFormSubmit = async (interaction: ButtonInteraction) => {
    if (this.submitted || !this.isReadyToSubmit()) {
      await interaction.deferUpdate();
      return;
    }

    this.submitted = true;

    const completionEmbed = createEmbeded(
      "Application Submitted!",
      "Thank you for applying to be a CougarCS Tutor. Your application is currently in review!"
    );

    await this.sendApplicationToDirector();

    await interaction.reply({ ephemeral: true, embeds: [completionEmbed] });
    return;
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

  private setInputValue = (index: number, value: string) => {
    const { modal } = this;

    modal.components[index].components[0].setValue(value);
  };

  private sendApplicationToDirector = async () => {
    const { user } = this.commandInteraction;

    const applicationEmbed = createEmbeded(
      "Tutor Application",
      `Submitted by: ${user}`
    )
      .addFields(
        ...[
          {
            name: "Name",
            value: this.formData.name,
            inline: true,
          },
          {
            name: "Pronouns",
            value: this.formData.pronouns.join(", ") || " ",
            inline: true,
          },
          {
            name: "PSID",
            value: this.formData.psid,
            inline: true,
          },
          {
            name: "Email",
            value: this.formData.email,
            inline: true,
          },
          {
            name: "Phone Number",
            value: this.formData.phoneNumber,
            inline: true,
          },
          {
            name: "Major",
            value:
              {
                yes: "Computer Science",
                no: "Non-CS",
              }[this.formData.isCSMajor] || "Undecided",
            inline: true,
          },
          {
            name: "B- or Less",
            value:
              {
                yes: "Yes",
                no: "No",
              }[this.formData.lessThanBMinus] || "N/A",
            inline: true,
          },
          {
            name: "Location Preference",
            value: this.formData.tutorType
              .map((loc) => {
                return (
                  {
                    "in person tutor": "In Person",
                  }[loc] || "Online"
                );
              })
              .join(" & "),
            inline: true,
          },
          {
            name: "Tutoring Courses",
            value: this.formData.coursesTutoring.join(", ") || " ",
            inline: true,
          },
          {
            name: "Reason",
            value: this.formData.reason || " ",
            inline: true,
          },
        ]
      )
      .setColor("Orange")
      .setThumbnail(user.displayAvatarURL());

    if (!this.commandInteraction.guild) return;

    const { guild } = this.commandInteraction;

    const guildDataResponse = await getGuildData(guild);

    if (guildDataResponse.error) return;

    const guildData = guildDataResponse.data;

    const reportChannelResponse = await getChannel("report", guild);

    if (reportChannelResponse.error) {
      return;
    }

    const reportChannel = reportChannelResponse.data;

    const components = [
      this.wrapButtonActionRow(this.acceptTutorButton, this.rejectTutorButton),
    ];

    await reportChannel.send({
      content: `<@${guildData.tutoring_director_id}>`,
      embeds: [applicationEmbed],
      components,
    });
  };

  private acceptTutorButton = new ButtonBuilder()
    .setCustomId(this.uniqueId("accept-button"))
    .setStyle(ButtonStyle.Primary)
    .setLabel("Offer Interview");

  private rejectTutorButton = new ButtonBuilder()
    .setCustomId(this.uniqueId("reject-button"))
    .setStyle(ButtonStyle.Danger)
    .setLabel("Reject");

  private onAcceptTutor = async (interaction: ButtonInteraction) => {
    await interaction.deferReply();

    const { user } = this.commandInteraction;

    await this.commandInteraction.followUp({
      ephemeral: true,
      content: `${user} Your tutoring application has been approved for an interview! Please schedule one here: https://calendly.com/cougarcs-tutoring/tutor-interview`,
    });

    const returnMessage = createEmbeded(
      "✅ Offer Sent!",
      `${user} has been successfully offered the opportunity to interview!`
    );

    await interaction.editReply({ embeds: [returnMessage] });

    this.removeInteractionListener();
  };

  private onRejectTutor = async (interaction: ButtonInteraction) => {
    await interaction.deferReply();

    const { user } = this.commandInteraction;

    await this.commandInteraction.followUp({
      ephemeral: true,
      content: `${user} Your tutoring application has been denied!`,
    });

    const returnMessage = createEmbeded(
      "✅ Tutor Rejected!",
      `${user} has been rejected as a Tutor!`
    );

    await interaction.editReply({ embeds: [returnMessage] });

    this.removeInteractionListener();
  };
}
