/* eslint-disable @typescript-eslint/no-explicit-any */
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

export type SupabaseResponse<T> =
  | {
      data: T;
      error: false;
      message: string;
    }
  | {
      error: true;
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

export type TransactionSelect = {
  contact_id: string;
  member_point_transaction_id: string;
  member_point_transaction_reason_id: string;
  point_value: number;
  timestamp: string;
};

export type EventAttendanceInsert = {
  contact_id: string;
  event_attendance_id?: string;
  event_id: string;
  swag?: boolean;
  timestamp: string;
};

export type GuildInsert = {
  admin_role_id?: string | null;
  guild_id: string;
  log_channel_id?: string | null;
  member_role_id?: string | null;
  name: string;
  officer_role_id?: string | null;
  report_channel_id?: string | null;
};

export type GuildUpdate = {
  admin_role_id?: string | null;
  guild_id?: string;
  log_channel_id?: string | null;
  member_role_id?: string | null;
  name?: string;
  officer_role_id?: string | null;
  report_channel_id?: string | null;
};

export type GuildSelect = {
  admin_role_id: string | null;
  guild_id: string;
  log_channel_id: string | null;
  member_role_id: string | null;
  name: string;
  officer_role_id: string | null;
  report_channel_id: string | null;
  tutor_role_id: string | null;
  tutoring_director_id: string | null;
};

export type MembershipSelect = {
  contact_id: string;
  end_date: string;
  membership_code_id: string;
  membership_id: string;
  semesters: number;
  start_date: string;
};

export type MembershipCodeSelect = {
  membership_code_id: string;
  message: string;
};

export type AttendanceSelect = {
  contact_id: string;
  event_attendance_id: string;
  event_id: string;
  swag: boolean;
  timestamp: string;
};

export type ShirtSizeSelect = {
  message: string;
  shirt_size_id: string;
};

export type MemberPointReasonSelect = {
  member_point_transaction_reason_id: string;
  message: string;
};

export type EventSelect = {
  date: string;
  description: string | null;
  duration: number | null;
  event_id: string;
  point_value: number;
  title: string;
};

export type EventAttendanceSelect = {
  contact_id: string;
  event_attendance_id: string;
  event_id: string;
  swag: boolean;
  timestamp: string;
};

export type TutorSignupFormData = {
  name: string;
  psid: string;
  email: string;
  phoneNumber: string;
  reason: string;
  pronouns: string[];
  classification: string;
  isCSMajor: string;
  lessThanBMinus: string;
  tutorType: string[];
  coursesTutoring: string[];
};

// TODO: ask Ben which is mandatory?
export type TutorLogInsert = {
    tutor_log_id?: string;
    tutor_id?: string;
    hours: number;
    tutoring_type_id: string;
    tutored_user: string;
    description: string;
    timestamp: string;
};
export type TutorLogSelect = {
    tutor_log_id: string;
    tutor_id: string;
    hours: number;
    tutoring_type_id: string;
    tutored_user: string;
    description: string;
    timestamp: string;
}

