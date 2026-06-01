import { Command } from "../interfaces/Command";
import { ping } from "../commands/officer-commands/ping";
import { supabaseping } from "../commands/officer-commands/supabase-ping";
import { claim } from "../commands/user-commands/claim";
import { whois } from "../commands/officer-commands/whois";
import { prunemembers } from "../commands/officer-commands/prune-members";
import { report } from "../commands/user-commands/report";
import { rolegiver } from "../commands/officer-commands/role-giver";
import { find } from "../commands/officer-commands/find";
import { memberships } from "../commands/officer-commands/memberships";
import { grantmembership } from "../commands/admin-commands/grant-membership";
import { updatecontact } from "../commands/admin-commands/update-contact";
import { cancelmembership } from "../commands/admin-commands/cancel-membership";
import { createcontact } from "../commands/admin-commands/create-contact";
import { setguildconfig } from "../commands/officer-commands/set-guild-config";
import { tutorstats } from "../commands/tutor-commands/tutor-stats";
import { tutorlog } from "../commands/tutor-commands/tutor-log";
import { appointTutor } from "../commands/officer-commands/appoint-tutor";
import { updateProfile } from "../commands/user-commands/update-profile";
import { createProfile } from "../commands/user-commands/create-profile";
import { tutorleaderboard } from "../commands/tutor-commands/tutor-leaderboard";

export const CommandList: Command[] = [
  cancelmembership,
  claim,
  createcontact,
  find,
  grantmembership,
  memberships,
  ping,
  prunemembers,
  report,
  rolegiver,
  setguildconfig,
  supabaseping,
  updatecontact,
  whois,
  tutorstats,
  tutorlog,
  appointTutor,
  updateProfile,
  createProfile,
  tutorleaderboard,
];
