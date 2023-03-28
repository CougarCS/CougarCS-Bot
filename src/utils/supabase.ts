import { createClient } from "@supabase/supabase-js";
import {
  ContactInsert,
  ContactKey,
  ContactQuery,
  ContactUpdate,
  EventAttendanceInsert,
  SupabaseResponse,
  TransactionInsert,
  UniqueContactQuery,
} from "./types";
import { Database } from "./schema";
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

const addQueryFilters = (query: any, queryData: ContactQuery) => {
  Object.keys(queryData).forEach((key) => {
    const contactKey = key as ContactKey;

    if (!queryData[contactKey]) return;

    if (contactKey === "uh_id" || contactKey === "contact_id") {
      query = query.eq(contactKey, queryData[contactKey]);
    } else {
      const stringSearch = `%${queryData[contactKey]}%`;
      query = query.ilike(contactKey, stringSearch);
    }
  });
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

  addQueryFilters(query, queryData);

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
  transactionInfo: TransactionInsert
): Promise<SupabaseResponse> => {
  const { queryData, point_value, reason_id } = transactionInfo;

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
  newData: ContactInsert
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
  newData: ContactUpdate,
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

export const getMembershipCodes = async (): Promise<SupabaseResponse> => {
  const membershipCodeResponse = await supabase
    .from("membership_code")
    .select("*");

  if (membershipCodeResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching the membership codes!",
    };
  }

  if (membershipCodeResponse.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No membership codes were found!",
    };
  }

  return {
    data: membershipCodeResponse.data,
    error: false,
    message: "Successfully fetched membership codes!",
  };
};

export const getShirtSizes = async (): Promise<SupabaseResponse> => {
  const shirtSizeResponse = await supabase.from("shirt_size").select("*");

  if (shirtSizeResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching the shirt sizes!",
    };
  }

  if (shirtSizeResponse.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No shirt sizes were found!",
    };
  }

  return {
    data: shirtSizeResponse.data,
    error: false,
    message: "Successfully fetched shirt sizes!",
  };
};

export const getMemberPointReasons = async (): Promise<SupabaseResponse> => {
  const pointReasonResponse = await supabase
    .from("member_point_transaction_reason")
    .select("*");

  if (pointReasonResponse.error) {
    return {
      data: [],
      error: true,
      message:
        "There was an error fetching the member point transaction reasons!",
    };
  }

  if (pointReasonResponse.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No member point transaction reasons were found!",
    };
  }

  return {
    data: pointReasonResponse.data,
    error: false,
    message: "Successfully fetched the member point transaction reasons!",
  };
};

export const getEvents = async (): Promise<SupabaseResponse> => {
  const eventResponse = await supabase.from("event").select("*");

  if (eventResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching the events!",
    };
  }

  if (eventResponse.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No events were found!",
    };
  }

  return {
    data: eventResponse.data,
    error: false,
    message: "Successfully fetched the events!",
  };
};

export const insertEventAttendance = async (
  attendance: EventAttendanceInsert
): Promise<SupabaseResponse> => {
  const attendanceResponse = await supabase
    .from("event_attendance")
    .insert(attendance)
    .select("*");

  if (attendanceResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error inserting the event attendance data!",
    };
  }

  return {
    data: attendanceResponse.data,
    error: false,
    message: "Successfully inserted the event attendance data!",
  };
};

export const getEventAttendance = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data[0];

  const attendanceResponse = await supabase
    .from("event_attendance")
    .select("*")
    .eq("contact_id", contact_id)
    .order("timestamp", { ascending: false });

  if (attendanceResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching event attendance data!",
    };
  }

  if (attendanceResponse.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No event attendance data was found!",
    };
  }

  return {
    data: attendanceResponse.data,
    error: false,
    message: "Successfully fetched event attendance data!",
  };
};

export const getEvent = async (event_id: string): Promise<SupabaseResponse> => {
  const eventResponse = await supabase
    .from("event")
    .select("*")
    .eq("event_id", event_id);

  if (eventResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching this event!",
    };
  }

  if (eventResponse.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No event could be found!",
    };
  }

  return {
    data: eventResponse.data,
    error: false,
    message: "Successfully fetched this event!",
  };
};

export const getMembershipReason = async (membership_code_id: string) => {
  const membershipReasonResponse = await supabase
    .from("membership_code")
    .select("message")
    .eq("membership_code_id", membership_code_id);

  if (membershipReasonResponse.error) {
    return {
      data: [],
      error: true,
      message: "There was an error fetching the membership reason!",
    };
  }

  if (membershipReasonResponse.data.length === 0) {
    return {
      data: [],
      error: true,
      message: "No membership reasons could be found!",
    };
  }

  return {
    data: membershipReasonResponse.data,
    error: false,
    message: "Successfully fetched the membership reason!",
  };
};
