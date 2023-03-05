import { Command } from "../interfaces/Command";
import { ping } from "../commands/officer_commands/ping";
import { balance } from "../commands/user_commands/balance";
import { supabaseping } from "../commands/officer_commands/supabaseping";
import { claim } from "../commands/user_commands/claim";
import { grant } from "../commands/officer_commands/grant";
import { leaderboard } from "../commands/user_commands/leaderboard";
import { whois } from "../commands/officer_commands/whois";
import { pay } from "../commands/member_commands/pay";
import { pruneexpiredmembers } from "../commands/officer_commands/pruneexpiredmembers";
import { report } from "../commands/user_commands/report";
import { rolegiver } from "../commands/officer_commands/rolegiver";
import { find } from "../commands/officer_commands/find";
import { memberships } from "../commands/officer_commands/memberships";
import { grantmembership } from "../commands/admin_commands/grantmembership";
import { updatecontact } from "../commands/admin_commands/updatecontact";
import { cancelmembership } from "../commands/admin_commands/cancelmembership";

export const CommandList: Command[] = [
  balance,
  cancelmembership,
  claim,
  find,
  grant,
  grantmembership,
  leaderboard,
  memberships,
  pay,
  ping,
  pruneexpiredmembers,
  report,
  rolegiver,
  supabaseping,
  updatecontact,
  whois,
];
