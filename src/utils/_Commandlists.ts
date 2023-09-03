import { Command } from "../interfaces/Command";
import { ping } from "../commands/officer-commands/ping";
import { balance } from "../commands/user-commands/balance";
import { supabaseping } from "../commands/officer-commands/supabase-ping";
import { claim } from "../commands/user-commands/claim";
import { grant } from "../commands/officer-commands/grant";
import { leaderboard } from "../commands/user-commands/leaderboard";
import { whois } from "../commands/officer-commands/whois";
import { pay } from "../commands/member-commands/pay";
import { prunemembers } from "../commands/officer-commands/prune-members";
import { report } from "../commands/user-commands/report";
import { rolegiver } from "../commands/officer-commands/role-giver";
import { find } from "../commands/officer-commands/find";
import { memberships } from "../commands/officer-commands/memberships";
import { grantmembership } from "../commands/admin-commands/grant-membership";
import { updatecontact } from "../commands/admin-commands/update-contact";
import { cancelmembership } from "../commands/admin-commands/cancel-membership";
import { checkin } from "../commands/officer-commands/checkin";
import { attendance } from "../commands/officer-commands/attendance";
import { createcontact } from "../commands/admin-commands/create-contact";
import { setguildconfig } from "../commands/officer-commands/set-guild-config";
import { tutorsignup } from "../commands/user-commands/tutor-signup";
import { tutorlog } from "../commands/user-commands/tutor-log";


export const CommandList: Command[] = [
  attendance,
  balance,
  cancelmembership,
  checkin,
  claim,
  createcontact,
  find,
  grant,
  grantmembership,
  leaderboard,
  memberships,
  pay,
  ping,
  prunemembers,
  report,
  rolegiver,
  setguildconfig,
  supabaseping,
  updatecontact,
  whois,
  tutorlog
];
