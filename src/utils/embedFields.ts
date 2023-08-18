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
  tutor: TutorLogSelect[]
): RestOrArray<APIEmbedField> => {
  var week = 0;
  var prevWeek = 0;
  var weeklyHours = 0;
  var iter = 0;
  var embeds = [];
  
  for (const log of tutor) {
    const {
      timestamp,
      hours
    } = log;

    const currentDate = new Date(timestamp);
    const startDate  = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor(( currentDate.getTime() - startDate.getTime() )/ (24 * 60 * 60 * 1000));

    // TODO: assuming Fall Semesters start in week 34, subtract 33
    week = Math.ceil(days / 7) - 28; 
    iter +=1;
   
    if (prevWeek == 0) {
      prevWeek = week;
      weeklyHours += hours;
    } 
    else if (week == prevWeek) {
        weeklyHours += hours;
    } else {
      embeds.push (
        {
          name: `Week ${prevWeek}`,
          value: `Hours: ${weeklyHours}`,
          inline: true,
        }
      )
      weeklyHours = hours  // reset hours for the next week
      prevWeek = week
    }
    
    // reach end of array
    if (iter == (tutor.length)) {
      embeds.push (
        {
          name: `Week ${prevWeek}`,
          value: `Hours: ${weeklyHours}`,
          inline: true,
        }
      )
    }
  }
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
