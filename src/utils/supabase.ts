/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import {
  ContactInsert,
  ContactQuery,
  ContactSelect,
  ContactUpdate,
  EventAttendanceInsert,
  EventAttendanceSelect,
  EventSelect,
  GuildSelect,
  GuildUpdate,
  MemberPointReasonSelect,
  MembershipCodeSelect,
  MembershipSelect,
  ShirtSizeSelect,
  SupabaseResponse,
  TransactionInsert,
  TransactionSelect,
  TutoringTypeSelect,
  UniqueContactQuery,
  UniqueTutorQuery,
  TutorQuery,
  TutorSelect,
  TutorLogInsert,
  TutorLogQuery,
  TutorLogSelect,
  TutorInsert,
} from "./types";
import { Database } from "./schema";
import { Guild, Role, TextChannel } from "discord.js";
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Due to previous conflicting queryData types, the parameters were temporarily changed to type 'any' to avoid errors
// TODO: Determine acceptable types for query parameters
const addQueryFilters = (query: any, queryData: any) => {
  Object.keys(queryData).forEach((key) => {
    if (!queryData[key]) return;

    if (key.match(/_id$/)) {
      query.eq(key, queryData[key]);
    } else {
      const stringSearch = `%${queryData[key]}%`;
      query.ilike(key, stringSearch);
    }
  });
};

export const pingSB = async (): Promise<SupabaseResponse<boolean>> => {
  const { error } = await supabase.from("contacts").select("*").limit(1);

  if (error) {
    return {
      error: true,
      message: error.message,
    };
  }

  return {
    data: true,
    error: false,
    message: "Supabase responded with no errors!",
  };
};

export const getContacts = async (
  queryData: ContactQuery
): Promise<SupabaseResponse<ContactSelect[]>> => {
  const query = supabase.from("contacts").select();

  addQueryFilters(query, queryData);

  const response = await query;

  if (response.error) {
    return {
      error: true,
      message: "There was an error fetching contacts!",
    };
  }

  if (response.data.length === 0) {
    return {
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
): Promise<SupabaseResponse<ContactSelect>> => {
  const contactRequest = await getContacts(queryData);

  if (contactRequest.error) {
    return contactRequest;
  }

  return {
    ...contactRequest,
    data: contactRequest.data[0],
  };
};

export const getContactId = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse<string>> => {
  if (queryData.contact_id) {
    return {
      data: queryData.contact_id,
      error: false,
      message: "Contact ID already exists!",
    };
  }

  const contactResponse = await getContact(queryData);

  if (contactResponse.error) {
    return contactResponse;
  }

  const { contact_id } = contactResponse.data;

  return {
    data: contact_id,
    error: false,
    message: "Successfully fetched Contact ID!",
  };
};

export const getMemberships = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse<MembershipSelect[]>> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data;

  const membershipResponse = await supabase
    .from("membership")
    .select("*")
    .eq("contact_id", contact_id)
    .order("end_date", { ascending: false });

  if (membershipResponse.error) {
    return {
      error: true,
      message: "There was an error fetching memberships!",
    };
  }

  if (membershipResponse.data.length === 0) {
    return {
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
): Promise<SupabaseResponse<boolean>> => {
  const membershipResponse = await getMemberships(queryData);

  if (membershipResponse.error) {
    return membershipResponse;
  }

  const end_date = membershipResponse.data[0].end_date;
  const activeMember = new Date(end_date).getTime() > new Date().getTime();

  return {
    data: activeMember,
    error: false,
    message: "Successfully determined current membership!",
  };
};

export const getBalance = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse<number>> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data;
  const balanceResponse = await supabase.rpc("balance", { contact_id });

  if (balanceResponse.error) {
    console.log(balanceResponse.error);
    return {
      error: true,
      message: "There was an error fetching CougarCoin balance!",
    };
  }

  const balance = balanceResponse.data || 0;

  return {
    data: balance,
    error: false,
    message: "Successfully fetched balance!",
  };
};

export const getLeaderboard = async (
  maxSlots: number
): Promise<SupabaseResponse<string[]>> => {
  const transactionsResponse = await supabase
    .from("member_point_transaction")
    .select("contact_id");

  if (transactionsResponse.error) {
    return {
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

    const balance = balanceResponse.data;
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
      identifierResponse.data;
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
): Promise<SupabaseResponse<ContactSelect>> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data;
  const updateResponse = await supabase
    .from("contacts")
    .update({ discord_snowflake })
    .eq("contact_id", contact_id)
    .select();

  if (updateResponse.error) {
    return {
      error: true,
      message: "There was an error updating the contact!",
    };
  }

  return {
    data: updateResponse.data[0],
    error: false,
    message: "Successfully updated contact!",
  };
};

export const insertTransaction = async (
  transactionInfo: TransactionInsert
): Promise<SupabaseResponse<TransactionSelect>> => {
  const { queryData, point_value, reason_id } = transactionInfo;

  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data;

  const insertResponse = await supabase
    .from("member_point_transaction")
    .insert({
      contact_id,
      point_value,
      member_point_transaction_reason_id: reason_id,
    })
    .select();

  if (insertResponse.error) {
    return {
      error: true,
      message: "There was an error inserting the transaction!",
    };
  }

  return {
    data: insertResponse.data[0],
    error: false,
    message: "Successfully inserted transaction!",
  };
};

export const insertMembership = async (
  queryData: UniqueContactQuery,
  length: string,
  reason_id: string
): Promise<SupabaseResponse<MembershipSelect>> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data;

  const today = new Date();
  const start_year = today.getFullYear();
  const start_date = today.toISOString();
  const spring_start = today.getMonth() < 6;
  const semester = length === "semester";
  const end_year = spring_start && semester ? start_year : start_year + 1;
  const end_month = spring_start !== semester ? "1" : "7";
  const end_date = `${end_year}-${end_month}-1 06:00:00`;

  const insertResponse = await supabase
    .from("membership")
    .insert({
      contact_id,
      start_date,
      end_date,
      membership_code_id: reason_id,
      semesters: semester ? 1 : 2,
    })
    .select();

  if (insertResponse.error) {
    return {
      error: true,
      message: "There was an error inserting the membership!",
    };
  }

  return {
    data: insertResponse.data[0],
    error: false,
    message: "Successfully inserted transaction!",
  };
};

export const cancelMembership = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse<MembershipSelect>> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data;

  const membershipResponse = await supabase
    .from("membership")
    .update({ end_date: new Date().toISOString() })
    .eq("contact_id", contact_id)
    .order("end_date", { ascending: false })
    .select();

  if (membershipResponse.error) {
    return {
      error: true,
      message: "There was an error updating the membership!",
    };
  }

  return {
    data: membershipResponse.data[0],
    error: false,
    message: "Successfully updated the membership",
  };
};

export const insertContact = async (
  newData: ContactInsert
): Promise<SupabaseResponse<ContactSelect>> => {
  const contactResponse = await supabase
    .from("contacts")
    .insert(newData)
    .select();

  if (contactResponse.error) {
    return {
      error: true,
      message: "There was an error inserting the contact!",
    };
  }

  return {
    data: contactResponse.data[0],
    error: false,
    message: "Successfully inserted contact data!",
  };
};

export const updateContact = async (
  newData: ContactUpdate,
  contact_id: string
): Promise<SupabaseResponse<ContactSelect>> => {
  const contactResponse = await supabase
    .from("contacts")
    .update(newData)
    .eq("contact_id", contact_id)
    .select();

  if (contactResponse.error) {
    return {
      error: true,
      message: "There was an error updating the contact!",
    };
  }

  return {
    data: contactResponse.data[0],
    error: false,
    message: "Successfully updated contact data!",
  };
};

export const getMembershipCodes = async (): Promise<
  SupabaseResponse<MembershipCodeSelect[]>
> => {
  const membershipCodeResponse = await supabase
    .from("membership_code")
    .select();

  if (membershipCodeResponse.error) {
    return {
      error: true,
      message: "There was an error fetching the membership codes!",
    };
  }

  if (membershipCodeResponse.data.length === 0) {
    return {
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

export const getShirtSizes = async (): Promise<
  SupabaseResponse<ShirtSizeSelect[]>
> => {
  const shirtSizeResponse = await supabase.from("shirt_size").select("*");

  if (shirtSizeResponse.error) {
    return {
      error: true,
      message: "There was an error fetching the shirt sizes!",
    };
  }

  if (shirtSizeResponse.data.length === 0) {
    return {
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

export const getMemberPointReasons = async (): Promise<
  SupabaseResponse<MemberPointReasonSelect[]>
> => {
  const pointReasonResponse = await supabase
    .from("member_point_transaction_reason")
    .select();

  if (pointReasonResponse.error) {
    return {
      error: true,
      message:
        "There was an error fetching the member point transaction reasons!",
    };
  }

  if (pointReasonResponse.data.length === 0) {
    return {
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

export const getEvents = async (): Promise<SupabaseResponse<EventSelect[]>> => {
  const eventResponse = await supabase.from("event").select("*");

  if (eventResponse.error) {
    return {
      error: true,
      message: "There was an error fetching the events!",
    };
  }

  if (eventResponse.data.length === 0) {
    return {
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
): Promise<SupabaseResponse<EventAttendanceSelect>> => {
  const attendanceResponse = await supabase
    .from("event_attendance")
    .insert(attendance)
    .select();

  if (attendanceResponse.error) {
    return {
      error: true,
      message: "There was an error inserting the event attendance data!",
    };
  }

  return {
    data: attendanceResponse.data[0],
    error: false,
    message: "Successfully inserted the event attendance data!",
  };
};

export const getEventAttendance = async (
  queryData: UniqueContactQuery
): Promise<SupabaseResponse<EventAttendanceSelect[]>> => {
  const contactIdResponse = await getContactId(queryData);

  if (contactIdResponse.error) {
    return contactIdResponse;
  }

  const contact_id = contactIdResponse.data;

  const attendanceResponse = await supabase
    .from("event_attendance")
    .select("*")
    .eq("contact_id", contact_id)
    .order("timestamp", { ascending: false });

  if (attendanceResponse.error) {
    return {
      error: true,
      message: "There was an error fetching event attendance data!",
    };
  }

  if (attendanceResponse.data.length === 0) {
    return {
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

export const getEvent = async (
  event_id: string
): Promise<SupabaseResponse<EventSelect>> => {
  const eventResponse = await supabase
    .from("event")
    .select()
    .eq("event_id", event_id);

  if (eventResponse.error) {
    return {
      error: true,
      message: "There was an error fetching this event!",
    };
  }

  if (eventResponse.data.length === 0) {
    return {
      error: true,
      message: "No event could be found!",
    };
  }

  return {
    data: eventResponse.data[0],
    error: false,
    message: "Successfully fetched this event!",
  };
};

export const getMembershipReason = async (
  membership_code_id: string
): Promise<SupabaseResponse<string>> => {
  const membershipReasonResponse = await supabase
    .from("membership_code")
    .select("message")
    .eq("membership_code_id", membership_code_id);

  if (membershipReasonResponse.error) {
    return {
      error: true,
      message: "There was an error fetching the membership reason!",
    };
  }

  if (membershipReasonResponse.data.length === 0) {
    return {
      error: true,
      message: "No membership reasons could be found!",
    };
  }

  return {
    data: membershipReasonResponse.data[0].message,
    error: false,
    message: "Successfully fetched the membership reason!",
  };
};

export const insertGuildData = async (
  guild: Guild
): Promise<SupabaseResponse<GuildSelect>> => {
  const guild_id = guild.id;
  const { name } = guild;

  const guildResponse = await supabase
    .from("discord_guilds")
    .insert({ guild_id, name })
    .select();

  if (guildResponse.error) {
    return {
      error: true,
      message: "There was an error inserting the guild data!",
    };
  }

  return {
    data: guildResponse.data[0],
    error: false,
    message: "Successfully inserted the guild data!",
  };
};

export const updateGuildData = async (
  newData: GuildUpdate,
  guild: Guild
): Promise<SupabaseResponse<GuildSelect>> => {
  const guildResponse = await supabase
    .from("discord_guilds")
    .update(newData)
    .eq("guild_id", guild.id)
    .select();

  if (guildResponse.error) {
    return {
      error: true,
      message: "There was an error updating the guild data!",
    };
  }

  return {
    data: guildResponse.data[0],
    error: false,
    message: "Successfully updated the guild data!",
  };
};

export const getGuildData = async (
  guild: Guild
): Promise<SupabaseResponse<GuildSelect>> => {
  const guildResponse = await supabase
    .from("discord_guilds")
    .select("*")
    .eq("guild_id", guild.id);

  if (guildResponse.error) {
    return {
      error: true,
      message: "There was an error fetching the guild data!",
    };
  }

  if (guildResponse.data.length === 0) {
    return {
      error: true,
      message: "No guild data was found!",
    };
  }

  return {
    data: guildResponse.data[0],
    error: false,
    message: "Successfully fetched the guild data!",
  };
};

export const getRole = async (
  roleName: "member" | "officer" | "admin" | "tutor",
  guild: Guild
): Promise<SupabaseResponse<Role>> => {
  const guildResponse = await getGuildData(guild);

  if (guildResponse.error) {
    return guildResponse;
  }

  const roleId = guildResponse.data[`${roleName}_role_id`];

  if (!roleId) {
    return {
      error: true,
      message: "There was an error fetching the role!",
    };
  }

  const role = await guild.roles.fetch(roleId);

  if (!role) {
    return {
      error: true,
      message: "There was an error fetching the role!",
    };
  }

  return {
    data: role,
    error: false,
    message: "Successfully fetched the role!",
  };
};

export const getChannel = async (
  channelName: "log" | "report",
  guild: Guild
): Promise<SupabaseResponse<TextChannel>> => {
  const guildResponse = await getGuildData(guild);

  if (guildResponse.error) {
    return guildResponse;
  }

  const channelId = guildResponse.data[`${channelName}_channel_id`];

  if (!channelId) {
    return {
      error: true,
      message: "There was an error fetching the channel!",
    };
  }

  const channel = await guild.channels.fetch(channelId);
  if (!channel) {
    return {
      error: true,
      message: "There was an error fetching the channel!",
    };
  }

  return {
    data: channel as TextChannel,
    error: false,
    message: "Successfully fetched the channel!",
  };
};

export const getTutors = async (
  queryData: TutorQuery
): Promise<SupabaseResponse<TutorSelect[]>> => {
  const query = supabase.from("tutors").select("*");

  addQueryFilters(query, queryData);

  const tutorsResponse = await query;

  if (tutorsResponse.error) {
    return {
      error: true,
      message: "There was an error fetching tutors!",
    };
  }

  if (tutorsResponse.data.length === 0) {
    return {
      error: true,
      message: "No tutors were found!",
    };
  }

  return {
    data: tutorsResponse.data,
    error: false,
    message: "Successfully fetched tutors!",
  };
};

export const getTutor = async (
  queryData: UniqueTutorQuery
): Promise<SupabaseResponse<TutorSelect>> => {
  const tutorResponse = await getTutors(queryData);

  if (tutorResponse.error) {
    return tutorResponse;
  }

  const mostRecentTutor = tutorResponse.data[0];

  const now = new Date();
  const tutorStart = new Date(mostRecentTutor.start_date);
  const tutorEnd = new Date(mostRecentTutor.end_date);

  if (now > tutorStart && now < tutorEnd) {
    return {
      ...tutorResponse,
      data: tutorResponse.data[0],
    };
  }

  return {
    error: true,
    message: "No current tutor data was found!",
  };
};

export const getTutorId = async (
  queryData: UniqueTutorQuery
): Promise<SupabaseResponse<string>> => {
  if (queryData.tutor_id) {
    return {
      data: queryData.tutor_id,
      error: false,
      message: "Tutor ID already exists!",
    };
  }

  const tutorResponse = await getTutor(queryData);

  if (tutorResponse.error) {
    return tutorResponse;
  }

  const { tutor_id } = tutorResponse.data;

  return {
    data: tutor_id,
    error: false,
    message: "Successfully fetched Tutor ID!",
  };
};

export const getTutorLogs = async (
  queryData: TutorLogQuery,
  start_date: Date,
  end_date: Date
): Promise<SupabaseResponse<TutorLogSelect[]>> => {
  const query = supabase
    .from("tutor_logs")
    .select("*")
    .gte("timestamp", start_date.toISOString())
    .lte("timestamp", end_date.toISOString())
    .order("timestamp", { ascending: true });

  addQueryFilters(query, queryData);

  const tutorLogsResponse = await query;

  if (tutorLogsResponse.error) {
    return {
      error: true,
      message: "There was an error fetching tutor logs!",
    };
  }

  if (tutorLogsResponse.data.length === 0) {
    return {
      error: true,
      message: "No tutor logs were found!",
    };
  }

  return {
    data: tutorLogsResponse.data,
    error: false,
    message: "Successfully fetched tutor logs!",
  };
};

export const insertTutor = async (
  contact_id: string
): Promise<SupabaseResponse<TutorSelect>> => {
  const today = new Date();
  const start_year = today.getFullYear();
  const spring_start = today.getMonth() < 6;
  const end_year = spring_start ? start_year : start_year + 1;
  const end_month = spring_start ? "7" : "1";
  const end_date = `${end_year}-${end_month}-1 06:00:00`;

  const newTutor: TutorInsert = {
    contact_id,
    end_date,
  };

  const tutorResponse = await supabase.from("tutors").insert(newTutor).select();

  if (tutorResponse.error) {
    return {
      error: true,
      message: "There was an error inserting the tutor!",
    };
  }

  return {
    data: tutorResponse.data[0],
    error: false,
    message: "Successfully inserted tutor!",
  };
};

export const insertTutorLog = async (
  tutorLogInfo: TutorLogInsert
): Promise<SupabaseResponse<TutorLogSelect>> => {
  const tutorLogResponse = await supabase
    .from("tutor_logs")
    .insert(tutorLogInfo)
    .select();

  if (tutorLogResponse.error) {
    return {
      error: true,
      message: "There was an error inserting the tutor log!",
    };
  }

  return {
    data: tutorLogResponse.data[0],
    error: false,
    message: "Successfully inserted tutor log data!",
  };
};

export const getTutoringTypes = async (): Promise<
  SupabaseResponse<TutoringTypeSelect[]>
> => {
  const tutoringTypeResponse = await supabase
    .from("tutoring_types")
    .select("*");

  if (tutoringTypeResponse.error) {
    return {
      error: true,
      message: "There was an error fetching the tutoring types!",
    };
  }

  if (tutoringTypeResponse.data.length === 0) {
    return {
      error: true,
      message: "No tutoring types were found!",
    };
  }

  return {
    data: tutoringTypeResponse.data,
    error: false,
    message: "Successfully fetched tutoring types!",
  };
};

export const getTutoringType = async (
  tutoring_type_id: string
): Promise<SupabaseResponse<TutoringTypeSelect>> => {
  const tutoringTypeResponse = await supabase
    .from("tutoring_types")
    .select()
    .eq("tutoring_type_id", tutoring_type_id);

  if (tutoringTypeResponse.error) {
    return {
      error: true,
      message: "There was an error fetching the tutoring type!",
    };
  }

  if (tutoringTypeResponse.data.length === 0) {
    return {
      error: true,
      message: "No tutoring types could be found!",
    };
  }

  return {
    data: tutoringTypeResponse.data[0],
    error: false,
    message: "Successfully fetched this tutoring type!",
  };
};

export const getTutorHours = async (
  queryData: UniqueTutorQuery
): Promise<SupabaseResponse<number>> => {
  const tutorIdResponse = await getTutorId(queryData);

  if (tutorIdResponse.error) {
    return tutorIdResponse;
  }

  const tutor_id = tutorIdResponse.data;
  const hourResponses = await supabase.rpc("hour", { tutor_id })

  if (hourResponses.error) {
    console.log(hourResponses.error);
    return {
      error: true,
      message: "There was an error fetching tutor hour balance!",
    };
  }

  const balance = hourResponses.data || 0;

  return {
    data: balance,
    error: false,
    message: "Successfully fetched tutor hour balance!",
  };
};


export const getTutorLeaderboard = async (
  maxSlots: number
): Promise<SupabaseResponse<string[]>> => {
  const transactionsResponse = await supabase
    .from("tutor_logs")
    .select("tutor_id");

  if (transactionsResponse.error) {
    return {
      error: true,
      message: "There was an error fetching transactions!",
    };
  }

  const tutorUniqueBalancePairs: { tutor_id: string; tutorBalance: number }[] = [];

  for (let i = 0; i < transactionsResponse.data.length; i++) {
    const { tutor_id } = transactionsResponse.data[i];
    if (tutorUniqueBalancePairs.find((uci) => uci.tutor_id === tutor_id)) {
      continue;
    }
    const tutorBalanceResponse = await getTutorHours({ tutor_id });

    if (tutorBalanceResponse.error) {
      return tutorBalanceResponse;
    }

    const tutorBalance = tutorBalanceResponse.data;
    tutorUniqueBalancePairs.push({ tutor_id, tutorBalance });
  }

  tutorUniqueBalancePairs.sort((a, b) => b.tutorBalance - a.tutorBalance);
  const arrayString: string[] = [];

  for (let i = 0; i < tutorUniqueBalancePairs.length; i++) {
    const { tutor_id, tutorBalance } = tutorUniqueBalancePairs[i];
    const tutorIdentifierResponse = await getTutor({ tutor_id });
    
    if (tutorIdentifierResponse.error) {
      continue;
    }
    const UUID = tutorIdentifierResponse.data.contact_id;
    const identifierResponse = await getContact({ contact_id: UUID });

    if (identifierResponse.error) {
      return identifierResponse;
    }

    const { discord_snowflake, first_name, last_name } = identifierResponse.data;
    const identifier = discord_snowflake ? `<@${discord_snowflake}>` : `${first_name} ${last_name}`;
    let icon = "";

    if (arrayString.length === 0) { icon = "🥇"; } 
    else if (arrayString.length === 1){ icon = "🥈"; }
    else if (arrayString.length === 2){ icon = "🥉";} 
    else { icon = `${arrayString.length + 1}.`; }

    const slot = `${icon} ${identifier}: **${tutorBalance}** hour(s)`;

    arrayString.push(slot);

    if (arrayString.length === maxSlots) break;
  }

  return {
    data: arrayString,  
    error: false,
    message: "Successfully fetched tutor leaderboard!",
  };
};
