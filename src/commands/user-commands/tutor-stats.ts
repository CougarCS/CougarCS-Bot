import { Command } from "../../interfaces/Command";
import { SlashCommandBuilder } from "discord.js";

export const tutorstats: Command = {
    data : new SlashCommandBuilder()
        .setName("tutor-stats")
        .setDescription("Check your tutor stats!")
        .addStringOption((option) =>
            option 
                .setName("semester")
                .setDescription("Type of semester!")
                .setRequired(false)
        )
        .addNumberOption((option) => 
            option
                .setName("year")
                .setDescription("Year of when you tutored!")
                .setRequired(false)
        )
        .addBooleanOption((option) =>
            option
                .setName("detail")
                .setDescription("Indicate if you would like a week by week breakdown of your tutoring sessions!")
                .setRequired(false)
        )
}
