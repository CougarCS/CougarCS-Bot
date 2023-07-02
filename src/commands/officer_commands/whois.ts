import {
  Guild,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import { createEmbeded } from "../../utils/embeded";
import {
  getBalance,
  getContact,
  getRole,
  isMember,
} from "../../utils/supabase";
import { commandLog, sendError } from "../../utils/logs";
import { ContactSelect } from "../../utils/types";
import { fullContactFields } from "../../utils/embedFields";

export const whois: Command = {
  data: new SlashCommandBuilder()
    .setName("whois")
    .setDescription("Check the database for a Discord member!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User you wish to look for")
        .setRequired(true)
    ),
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const { user } = interaction;
    const guild = interaction.guild as Guild;

    const whoUserOption = interaction.options.get("user", true);
    const whoUser = whoUserOption.user as User;

    commandLog(interaction, "/whois", "Blue", [
      { name: "user", value: `${whoUser}` },
    ]);

    const errorTitle = "❌ Whois Failed!";

    const discord_snowflake = whoUser.id;
    const contactResponse = await getContact({ discord_snowflake });

    if (contactResponse.error) {
      await sendError(errorTitle, contactResponse.message, interaction);
      return;
    }

    const contact: ContactSelect = contactResponse.data[0];
    const { contact_id } = contact;
    const memberResponse = await isMember({ contact_id });

    const activeMember = memberResponse.data[0];
    const balanceResponse = await getBalance({ contact_id });

    if (balanceResponse.error) {
      await sendError(errorTitle, balanceResponse.message, interaction);
      return;
    }

    const balance = balanceResponse.data[0];

    const member = await guild.members.fetch({ user });
    const adminRoleResponse = await getRole("admin", guild);

    let isAdmin = false;

    if (!adminRoleResponse.error) {
      const adminRole = adminRoleResponse.data[0] as Role;
      isAdmin = !!member.roles.cache.find((r) => r === adminRole);
    }

    const returnMessage = createEmbeded("👤 Contact Found!", " ")
      .setColor("Blue")
      .addFields(...fullContactFields(contact, balance, activeMember, isAdmin))
      .setThumbnail(whoUser.displayAvatarURL());

    await interaction.editReply({ embeds: [returnMessage] });
    return;
  },
};
