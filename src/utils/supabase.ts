import { createClient } from "@supabase/supabase-js";
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

//  ping()
export const pingSB = async () => {
  return await supabase.from("contacts").select("*").limit(1);
};

// isMember()
export const isMember = async (contact_id: string): Promise<boolean> => {
  const memberships = await supabase
    .from("membership")
    .select("*")
    .eq("contact_id", contact_id)
    .order("end_date", { ascending: false });
  if (memberships.error || memberships.data.length === 0) {
    return false;
  }
  const { end_date } = memberships.data[0];
  return (end_date as string) > new Date().toISOString();
};

//  findUser( psid, email )
export const findMember = async (
  psid: number,
  email: string
): Promise<{
  status: "success" | "failure";
  message: string;
  contact: any;
}> => {
  const contact = await supabase
    .from("contacts")
    .select("*")
    .eq("uh_id", psid)
    .eq("email", email);
  if (contact.error || contact.data.length === 0) {
    return {
      status: "failure",
      message: "The PSID and Email do not match our records!",
      contact: contact,
    };
  }
  const { contact_id } = contact.data[0];
  const activeMember = await isMember(contact_id);
  if (!activeMember) {
    return {
      status: "failure",
      message: "This membership is inactive!",
      contact: contact.data[0],
    };
  }
  return {
    status: "success",
    message: "The membership is active!",
    contact: contact.data[0],
  };
};

// findMember(discord_snowflake)
export const findMemberWithSnowflake = async (
  discord_snowflake
): Promise<{
  status: "success" | "failure";
  message: string;
  contact: any;
}> => {
  const contactFetch = await findContactWithSnowflake(discord_snowflake);

  if (contactFetch.status === "failure") {
    return contactFetch;
  }

  const { contact_id } = contactFetch.contact;
  const activeMember = await isMember(contact_id);
  if (!activeMember) {
    return {
      status: "failure",
      message: "This membership is inactive!",
      contact: contactFetch.contact,
    };
  }
  return {
    status: "success",
    message: "The membership is active!",
    contact: contactFetch.contact,
  };
};

// findContactWithSnowflake( discord_snowflake )
export const findContactWithSnowflake = async (
  discord_snowflake
): Promise<{
  status: "success" | "failure";
  message: string;
  contact: any;
}> => {
  const contact = await supabase
    .from("contacts")
    .select("*")
    .eq("discord_snowflake", discord_snowflake);
  if (contact.error || contact.data.length === 0) {
    return {
      status: "failure",
      message:
        "Discord account is not linked! Try specifying the  PSID and Email!",
      contact: contact,
    };
  }
  const { contact_id } = contact.data[0];
  return {
    status: "success",
    message: "Contact found!",
    contact: contact.data[0],
  };
};

// findMemberWithContactID( contact_id )
export const findMemberWithContactID = async (
  contact_id
): Promise<{
  status: "success" | "failure";
  message: string;
  contact: any;
}> => {
  const contact = await supabase
    .from("contacts")
    .select("*")
    .eq("contact_id", contact_id);
  if (contact.error || contact.data.length === 0) {
    return {
      status: "failure",
      message: "Contact not found!",
      contact: contact,
    };
  }
  const activeMember = await isMember(contact_id);
  if (!activeMember) {
    return {
      status: "failure",
      message: "This membership is inactive!",
      contact: contact.data[0],
    };
  }
  return {
    status: "success",
    message: "The membership is active!",
    contact: contact.data[0],
  };
};

// addSnowflake( contact_id )
export const addSnowflake = async (
  contact_id: string,
  discord_snowflake: string
) => {
  return await supabase
    .from("contacts")
    .update({ discord_snowflake })
    .eq("contact_id", contact_id)
    .select();
};

//  getBalance( discord_snowflake )
export const getBalance = async (
  discord_snowflake
): Promise<{
  status: "failure" | "success";
  message: string;
  balance: number;
}> => {
  const member = await findMemberWithSnowflake(discord_snowflake);
  if (member.status == "failure") {
    return {
      status: "failure",
      message: "User's membership could not be confirmed.",
      balance: 0,
    };
  }
  const transactions = await supabase
    .from("member_point_transaction")
    .select("point_value")
    .eq("contact_id", member.contact.contact_id);
  if (transactions.error) {
    return {
      status: "failure",
      message: "There was an error fetching the user's balance.",
      balance: 0,
    };
  }
  let sum = 0;
  transactions.data.forEach((p) => (sum += parseInt(p.point_value)));
  return {
    status: "success",
    message: "CougarCoin balance retrieved.",
    balance: sum,
  };
};

//  createTransaction( discord_snowflake, point_value, reason_id )
export const createTransaction = async (
  discord_snowflake,
  point_value: number,
  reason_id: string
): Promise<{
  status: "failure" | "success";
  message: string;
}> => {
  const membership = await findMemberWithSnowflake(discord_snowflake);
  if (membership.status === "failure") {
    return {
      status: "failure",
      message: membership.message,
    };
  }
  const { contact_id } = membership.contact;
  const create = await supabase.from("member_point_transaction").insert({
    contact_id,
    point_value,
    member_point_transaction_reason_id: reason_id,
  });
  if (create.error) {
    return {
      status: "failure",
      message: `Error: ${JSON.stringify(create.error)}`,
    };
  }
  return {
    status: "success",
    message: "The transaction has been completed!",
  };
};

//  getLeaderboard()
export const getLeaderboard = async (max: number) => {
  const transactions = await supabase
    .from("member_point_transaction")
    .select("*");
  if (transactions.error) {
    return "sorry";
  }
  const totals: { contact_id; sum }[] = [];
  transactions.data.forEach((transaction) => {
    if (!totals.find((t) => t.contact_id === transaction.contact_id)) {
      totals.push({ contact_id: transaction.contact_id, sum: 0 });
    }
    const cur = totals.find((t) => t.contact_id === transaction.contact_id) as {
      contact_id: any;
      sum: any;
    };
    cur.sum += transaction.point_value;
  });
  totals.sort((a, b) => b.sum - a.sum);
  let finalstr = "";
  let j = 1;
  for (let i = 0; i < totals.length; i++) {
    const member = await findMemberWithContactID(totals[i].contact_id);
    if (member.status === "success") {
      let name = member.contact.discord_snowflake
        ? `<@${member.contact.discord_snowflake}>`
        : `${member.contact.first_name} ${member.contact.last_name}`;
      finalstr = `${finalstr}${j}. ${name}: **${totals[i].sum}**\n`;
      if (j === max) break;
      j++;
    }
  }
  return finalstr;
};
