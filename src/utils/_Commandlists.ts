import { Command } from "../interfaces/Command";
import { ping } from "../commands/officer_commands/ping";
import { resetreactionroles } from "../commands/officer_commands/resetreactionroles";
import { balance } from "../commands/user_commands/balance";
import { supabaseping } from "../commands/officer_commands/supabaseping";
import { claim } from "../commands/user_commands/claim";
import { grant } from "../commands/officer_commands/grant";
import { leaderboard } from "../commands/user_commands/leaderboard";
import { whois } from "../commands/officer_commands/whois";

export const CommandList: Command[] = [
  balance,
  claim,
  grant,
  leaderboard,
  ping,
  resetreactionroles,
  supabaseping,
  whois,
];
