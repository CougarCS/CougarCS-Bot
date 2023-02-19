import { Command } from "../interfaces/Command";
import { ping } from "../commands/admin_commands/ping";
import { resetreactionroles } from "../commands/admin_commands/resetreactionroles";
import { balance } from "../commands/user_commands/balance";
import { supabaseping } from "../commands/admin_commands/supabaseping";
import { claim } from "../commands/user_commands/claim";
import { grant } from "../commands/admin_commands/grant";
import { leaderboard } from "../commands/user_commands/leaderboard";

export const CommandList: Command[] = [
  balance,
  claim,
  grant,
  leaderboard,
  ping,
  resetreactionroles,
  supabaseping,
];
