import { Command } from "../interfaces/Command";
import { ping } from "../commands/ping";
import { balance } from "../commands/balance";
export const CommandList: Command[] = [ping, balance];
