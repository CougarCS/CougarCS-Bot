import { APIEmbedField, RestOrArray } from "discord.js";
import { ContactSelect } from "./types";

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

export const fullContactFields = (
  contact: ContactSelect,
  balance: number,
  activeMember: boolean
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
