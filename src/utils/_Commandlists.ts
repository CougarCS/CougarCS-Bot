import { Command } from "../interfaces/Command";
import { ping } from "../commands/officer_commands/ping";
import { balance } from "../commands/user_commands/balance";
import { supabaseping } from "../commands/officer_commands/supabasePing";
import { claim } from "../commands/user_commands/claim";
import { grant } from "../commands/officer_commands/grant";
import { leaderboard } from "../commands/user_commands/leaderboard";
import { whois } from "../commands/officer_commands/whois";
import { pay } from "../commands/member_commands/pay";
import { prunemembers } from "../commands/officer_commands/pruneMembers";
import { report } from "../commands/user_commands/report";
import { rolegiver } from "../commands/officer_commands/roleGiver";
import { find } from "../commands/officer_commands/find";
import { memberships } from "../commands/officer_commands/memberships";
import { grantmembership } from "../commands/admin_commands/grantMembership";
import { updatecontact } from "../commands/admin_commands/updateContact";
import { cancelmembership } from "../commands/admin_commands/cancelMembership";
import { checkin } from "../commands/officer_commands/checkin";
import { attendance } from "../commands/officer_commands/attendance";
import { createcontact } from "../commands/admin_commands/createContact";
import { setguildconfig } from "../commands/officer_commands/setGuildConfig";

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
];
