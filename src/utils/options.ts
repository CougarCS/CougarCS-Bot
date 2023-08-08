import { APIApplicationCommandOptionChoice } from "discord.js";
import {
  getEvents,
  getMemberPointReasons,
  getMembershipCodes,
  getShirtSizes,
} from "./supabase";

export const membershipLengthOptions: APIApplicationCommandOptionChoice<string>[] =
  [
    { name: "Semester", value: "semester" },
    { name: "Year", value: "year" },
  ];

export const reportOptions = (): APIApplicationCommandOptionChoice<string>[] =>
  ["Member Issue", "Event Issue", "Administration Issue", "Other"].map((i) => ({
    name: i,
    value: i,
  }));

export const membershipCodeOptions = async (): Promise<
  APIApplicationCommandOptionChoice<string>[]
> => {
  const membershipCodeResponse = await getMembershipCodes();

  if (membershipCodeResponse.error) {
    return [{ name: "Payment", value: "mc-p" }];
  }

  const membershipCodeData = membershipCodeResponse.data;
  const membershipCodes: APIApplicationCommandOptionChoice<string>[] = [];

  membershipCodeData.forEach((mc) =>
    membershipCodes.push({ name: mc.message, value: mc.membership_code_id })
  );

  return membershipCodes;
};

export const shirtSizeOptions = async (): Promise<
  APIApplicationCommandOptionChoice<string>[]
> => {
  const shirtSizeResponse = await getShirtSizes();

  if (shirtSizeResponse.error) {
    return [{ name: "Medium", value: "M" }];
  }

  const shirtSizeData = shirtSizeResponse.data;
  const shirtSizes: APIApplicationCommandOptionChoice<string>[] = [];

  shirtSizeData.forEach((ss) =>
    shirtSizes.push({ name: ss.message, value: ss.shirt_size_id })
  );

  return shirtSizes;
};

export const memberPointReasonOptions = async (): Promise<
  APIApplicationCommandOptionChoice<string>[]
> => {
  const memberPointReasonResponse = await getMemberPointReasons();

  if (memberPointReasonResponse.error) {
    return [{ name: "General Grant", value: "mpt-general" }];
  }

  const pointReasonData = memberPointReasonResponse.data;
  const pointReasons: APIApplicationCommandOptionChoice<string>[] = [];

  pointReasonData.forEach((pr) =>
    pointReasons.push({
      name: pr.message,
      value: pr.member_point_transaction_reason_id,
    })
  );

  return pointReasons;
};

export const eventOptions = async (): Promise<
  APIApplicationCommandOptionChoice<string>[]
> => {
  const eventResponse = await getEvents();

  if (eventResponse.error) {
    return [{ name: "Error: Try Again Later", value: "error" }];
  }

  const eventData = eventResponse.data;
  const events: APIApplicationCommandOptionChoice<string>[] = [];

  eventData.forEach((event) =>
    events.push({
      name: event.title,
      value: event.event_id,
    })
  );

  return events;
};

export const tutorStatsLengthOptions: APIApplicationCommandOptionChoice<string>[] =
  [
    { name: "Spring", value: "Spring" },
    { name: "Fall", value: "Fall" },
  ];