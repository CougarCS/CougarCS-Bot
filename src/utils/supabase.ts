import { PostgrestSingleResponse, createClient } from "@supabase/supabase-js";
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export type UniqueContactKey =
  | "contact_id"
  | "uh_id"
  | "email"
  | "discord_snowflake";

export type ContactKey = UniqueContactKey | "first_name" | "last_name";

export type UniqueContactQuery = {
  contact_id?: string;
  uh_id?: number;
  email?: string;
  discord_snowflake?: string;
};

export type ContactQuery = {
  contact_id?: string;
  uh_id?: number;
  email?: string;
  discord_snowflake?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: number;
  shirt_size_id?: string;
};

export type SupabaseResponse = {
  data: any[];
  error: boolean;
  message: string;
};

export const pingSB = async (): Promise<SupabaseResponse> => {
  const { data, error } = await supabase.from("contacts").select("*").limit(1);
  if (error) {
    return {
      data: [],
      error: true,
      message: error.message,
    };
  }
  return {
    data,
    error: false,
    message: "Supabase responded with no errors!",
  };
};

export const getContacts = async (
  queryData: ContactQuery
): Promise<SupabaseResponse> => {
  let query = supabase.from("contacts").select("*");

  Object.keys(queryData).forEach((key) => {
    if (!queryData[key as ContactKey]) return;
    query = query.eq(key, queryData[key as ContactKey]);
  });

  const response = await query;

  if (response.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching contacts!",
    };
  }

  if (response.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No contacts were found!",
    };
  }

  return {
    data: response.data,
    error: false,
    message: "Successfully fetched contacts!",
  };
};

export const getContact = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse> => {
  const contactRequest = await getContacts(queryData);

  if (contactRequest.error) {
    return contactRequest;
  }

  return contactRequest;
};

export const getContactId = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse> => {
  if (queryData.contact_id) {
    return {
      data: [queryData.contact_id],
      error: false,
      message: "Contact ID already exists!",
    };
  }

  const contactResponse = await getContact(queryData);

  if (contactResponse.error) {
    return contactResponse;
  }

  const contact = contactResponse.data[0];

  return {
    data: [contact.contact_id],
    error: false,
    message: "Successfully fetched Contact ID!",
  };
};

export const getMemberships = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data[0];

  const membershipResponse = await supabase
    .from("membership")
    .select("*")
    .eq("contact_id", contact_id)
    .order("end_date", { ascending: false });

  if (membershipResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching memberships!",
    };
  }

  if (membershipResponse.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No memberships were found!",
    };
  }

  return {
    data: membershipResponse.data,
    error: false,
    message: "Successfully fetched memberships!",
  };
};

export const isMember = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse> => {
  const membershipResponse = await getMemberships(queryData);

  if (membershipResponse.error) {
    return membershipResponse;
  }

  const end_date = membershipResponse.data[0].end_date;
  const activeMember = new Date(end_date).getTime() > new Date().getTime();

  return {
    data: [activeMember],
    error: false,
    message: "Successfully determined current membership!",
  };
};

export const getBalance = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data[0];
  const balanceResponse = await supabase.rpc("balance", { contact_id });

  if (balanceResponse.error) {
    return {
      data: [0],
      error: true,
      message: "There was an error fetching CougarCoin balance!",
    };
  }

  const balance = balanceResponse.data || 0;

  return {
    data: [balance],
    error: false,
    message: "Successfully fetched balance!",
  };
};

export const getLeaderboard = async (
  maxSlots: number
): Promise<SupabaseResponse> => {
  const transactionsResponse = await supabase
    .from("member_point_transaction")
    .select("contact_id");

  if (transactionsResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching transactions!",
    };
  }

  const uniqueBalancePairs: { contact_id: string; balance: number }[] = [];

  for (let i = 0; i < transactionsResponse.data.length; i++) {
    const { contact_id } = transactionsResponse.data[i];
    if (uniqueBalancePairs.find((uci) => uci.contact_id === contact_id)) {
      continue;
    }
    const balanceResponse = await getBalance({ contact_id });

    if (balanceResponse.error) {
      return balanceResponse;
    }

    const balance = balanceResponse.data[0];
    uniqueBalancePairs.push({ contact_id, balance });
  }

  uniqueBalancePairs.sort((a, b) => b.balance - a.balance);
  const arrayString: string[] = [];

  for (let i = 0; i < uniqueBalancePairs.length && i < maxSlots; i++) {
    const { contact_id, balance } = uniqueBalancePairs[i];
    const identifierResponse = await getContact({ contact_id });

    if (identifierResponse.error) {
      return identifierResponse;
    }

    const { discord_snowflake, first_name, last_name } =
      identifierResponse.data[0];
    const identifier = discord_snowflake
      ? `<@${discord_snowflake}>`
      : `${first_name} ${last_name}`;
    const slot = `${i + 1}. ${identifier}: **${balance}**`;

    arrayString.push(slot);
  }

  return {
    data: arrayString,
    error: false,
    message: "Successfully fetched leaderboard!",
  };
};

export const updateDiscordSnowflake = async (
  queryData: UniqueContactQuery,
  discord_snowflake: string
): Promise<SupabaseResponse> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data[0];
  const updateResponse = await supabase
    .from("contacts")
    .update({ discord_snowflake })
    .eq("contact_id", contact_id)
    .select();

  if (updateResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error updating the contact!",
    };
  }

  return {
    data: updateResponse.data,
    error: false,
    message: "Successfully updated contact!",
  };
};

export const insertTransaction = async (
  queryData: UniqueContactQuery,
  point_value: number,
  reason_id: string
): Promise<SupabaseResponse> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data[0];

  const insertResponse = await supabase
    .from("member_point_transaction")
    .insert({
      contact_id,
      point_value,
      member_point_transaction_reason_id: reason_id,
    });

  if (insertResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error inserting the transaction!",
    };
  }

  return {
    data: [],
    error: false,
    message: "Successfully inserted transaction!",
  };
};

export const insertMembership = async (
  queryData: UniqueContactQuery,
  length: string,
  reason_id: string
): Promise<SupabaseResponse> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data[0];

  const today = new Date();
  const start_year = today.getFullYear();
  const start_date = today.toISOString();
  const spring_start = today.getMonth() < 6;
  const semester = length === "semester";
  const end_year = spring_start && semester ? start_year : start_year + 1;
  const end_month = spring_start !== semester ? "1" : "7";
  const end_date = `${end_year}-${end_month}-1 06:00:00`;

  const insertResponse = await supabase.from("membership").insert({
    contact_id,
    start_date,
    end_date,
    membership_code_id: reason_id,
  });

  if (insertResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error inserting the membership!",
    };
  }

  return {
    data: [],
    error: false,
    message: "Successfully inserted transaction!",
  };
};

export const cancelMembership = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data[0];

  const membershipResponse = await supabase
    .from("membership")
    .update({ end_date: new Date().toISOString() })
    .eq("contact_id", contact_id)
    .order("end_date", { ascending: false });

  if (membershipResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error updating the membership!",
    };
  }

  return {
    data: [],
    error: false,
    message: "Successfully updated the membership",
  };
};

export const insertContact = async (
  newData: ContactQuery
): Promise<SupabaseResponse> => {
  const contactResponse = await supabase
    .from("contacts")
    .insert(newData)
    .select("*");

  if (contactResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error inserting the contact!",
    };
  }

  return {
    data: contactResponse.data,
    error: false,
    message: "Successfully inserted contact data!",
  };
};

export const updateContact = async (
  newData: ContactQuery,
  contact_id: string
): Promise<SupabaseResponse> => {
  const contactResponse = await supabase
    .from("contacts")
    .update(newData)
    .eq("contact_id", contact_id)
    .select("*");

  if (contactResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error updating the contact!",
    };
  }

  return {
    data: contactResponse.data,
    error: false,
    message: "Successfully updated contact data!",
  };
};
