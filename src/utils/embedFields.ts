import { APIEmbedField, RestOrArray } from "discord.js";
import { start } from "repl";
import { ContactSelect, GuildSelect, TutorLogSelect } from "./types";

export const contactFields = (
  contact: ContactSelect
): RestOrArray<APIEmbedField> => {
  const {
    contact_id,
    uh_id,
    email,
    first_name,
    last_name,
    discord_snowflake,
    phone_number,
    shirt_size_id,
    timestamp,
  } = contact;

  const timeString = timestamp ? new Date(timestamp).toUTCString() : "null";

  return [
    {
      name: "Discord",
      value: `<@${discord_snowflake}>`,
      inline: true,
    },
    {
      name: "First Name",
      value: `${first_name}`,
      inline: true,
    },
    {
      name: "Last Name",
      value: `${last_name}`,
      inline: true,
    },
    {
      name: "PSID",
      value: `${uh_id}`,
      inline: true,
    },
    {
      name: "Email",
      value: `${email}`,
      inline: true,
    },
    {
      name: "Phone Number",
      value: `${phone_number}`,
      inline: true,
    },
    {
      name: "Shirt Size",
      value: `${shirt_size_id}`,
      inline: true,
    },
    {
      name: "Contact ID",
      value: `${contact_id}`,
      inline: true,
    },
    {
      name: "Timestamp",
      value: `${timeString}`,
      inline: true,
    },
  ];
};

export const tutorStatsFields = (
  tutor: TutorLogSelect[],
  detail: Boolean,
): RestOrArray<APIEmbedField> => {
  var prevWeek = " ";
  var weeklyHours = 0;
  var totalHours = 0;
  var iter = 0;
  var embeds = [];
  
  for (const log of tutor) {
    const {
      timestamp,
      hours
    } = log;

    iter +=1;

    const currentDate = new Date(timestamp);
    const firstDayOfWeek = Math.abs(currentDate.getDay() - currentDate.getDate());
    const weekDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDayOfWeek).toLocaleDateString();

    if (detail) {
      if (prevWeek == " ") {
        prevWeek = weekDate;
        weeklyHours += hours;
      } else if (weekDate == prevWeek) {
          weeklyHours += hours;
      } else {
          embeds.push (
            {
              name: `Week of ${prevWeek}`,
              value: `Hours: ${weeklyHours}`,
              inline: true,
            }
          )
          weeklyHours = hours;  // reset hours for the next week
          prevWeek = weekDate;
      };
      // reach end of array
      if (iter == tutor.length) {
        embeds.push (
          {
            name: `Week ${prevWeek}`,
            value: `Hours: ${weeklyHours}`,
            inline: true,
          }
        );
      };
  } else {
      totalHours += hours;
      if (iter == tutor.length) {
        embeds.push ( 
          {
            name: " ",
            value: `Hours: ${totalHours}`,
            inline: true,
          }
        )
      };
    };
  };
return embeds
};

export const fullContactFields = (
  contact: ContactSelect,
  balance: number,
  activeMember: boolean,
  isAdmin?: boolean
): RestOrArray<APIEmbedField> => {
  const {
    contact_id,
    uh_id,
    email,
    first_name,
    last_name,
    discord_snowflake,
    phone_number,
    shirt_size_id,
    timestamp,
  } = contact;

  const timeString = timestamp ? new Date(timestamp).toUTCString() : "null";

  return [
    {
      name: "Discord",
      value: `<@${discord_snowflake}>`,
      inline: true,
    },
    {
      name: "Member",
      value: activeMember ? "✅" : "❌",
      inline: true,
    },
    {
      name: "CougarCoin",
      value: `${balance}`,
      inline: true,
    },
    {
      name: "First Name",
      value: `${first_name}`,
      inline: true,
    },
    {
      name: "Last Name",
      value: `${last_name}`,
      inline: true,
    },
    {
      name: "PSID",
      value: `${uh_id}`,
      inline: true,
    },
    {
      name: "Email",
      value: `${email}`,
      inline: true,
    },
    {
      name: "Phone Number",
      value: `${isAdmin ? phone_number : "\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*"}`,
      inline: true,
    },
    {
      name: "Shirt Size",
      value: `${shirt_size_id}`,
      inline: true,
    },
    {
      name: "Contact ID",
      value: `${contact_id}`,
      inline: true,
    },
    {
      name: "Timestamp",
      value: `${timeString}`,
      inline: true,
    },
  ];
};

export const guildConfigFields = (
  guildConfig: GuildSelect
): RestOrArray<APIEmbedField> => {
  const {
    guild_id,
    name,
    admin_role_id,
    officer_role_id,
    member_role_id,
    log_channel_id,
    report_channel_id,
    tutor_role_id,
    tutoring_director_id,
  } = guildConfig;

  return [
    {
      name: "Guild Name",
      value: `${name}`,
      inline: true,
    },
    {
      name: "Admin Role",
      value: `<@&${admin_role_id}>`,
      inline: true,
    },
    {
      name: "Officer Role",
      value: `<@&${officer_role_id}>`,
      inline: true,
    },
    {
      name: "Member Role",
      value: `<@&${member_role_id}>`,
      inline: true,
    },
    {
      name: "Tutor Role",
      value: `<@&${tutor_role_id}>`,
      inline: true,
    },
    {
      name: "Tutoring Director",
      value: `<@${tutoring_director_id}>`,
      inline: true,
    },
    {
      name: "Log Channel",
      value: `<#${log_channel_id}>`,
      inline: true,
    },
    {
      name: "Report Channel",
      value: `<#${report_channel_id}>`,
      inline: true,
    },
    {
      name: "Guild ID",
      value: `${guild_id}`,
      inline: true,
    },
  ];
};
