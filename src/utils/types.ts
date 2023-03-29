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

export type ContactUpdate = {
  contact_id?: string;
  discord_snowflake?: string | null;
  email?: string;
  first_name?: string;
  last_name?: string | null;
  phone_number?: number | null;
  shirt_size_id?: string | null;
  timestamp?: string | null;
  uh_id?: number | null;
};

export type ContactInsert = {
  contact_id?: string;
  discord_snowflake?: string | null;
  email: string;
  first_name: string;
  last_name?: string | null;
  phone_number?: number | null;
  shirt_size_id?: string | null;
  timestamp?: string | null;
  uh_id?: number | null;
};

export type ContactSelect = {
  contact_id: string;
  discord_snowflake: string | null;
  email: string;
  first_name: string;
  last_name: string | null;
  phone_number: number | null;
  shirt_size_id: string | null;
  timestamp: string | null;
  uh_id: number | null;
};

export type TransactionInsert = {
  queryData: UniqueContactQuery;
  point_value: number;
  reason_id: string;
};

export type EventAttendanceInsert = {
  contact_id: string;
  event_attendance_id?: string;
  event_id: string;
  swag?: boolean;
  timestamp: string;
};
