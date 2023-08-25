import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";
import { commandLog } from "../../utils/logs";
import TutorSignupForm from "../../components/TutorSignupForm";

export const tutorsignup: Command = {
  data: new SlashCommandBuilder()
    .setName("tutor-signup")
    .setDescription("Sign up to be a CougarCS tutor!"),
  run: async (interaction, client) => {
    commandLog(interaction, "/tutor-signup", "Orange", []);

    const form = new TutorSignupForm(interaction, client);

    await form.sendForm();
  },
};

/**
 * /tutor-signup
 *
 * Embeded message describing the position/application
 * -> Button to open modal
 *
 * Enter 5 text inputs in modal
 *
 * -> Button turns into edit modal
 * -> Follow up with selections
 *
 */
