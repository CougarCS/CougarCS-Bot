# CougarCS Discord Bot!

- #### Requirements
  - [NodeJS](https://nodejs.org/en/) Version 16+
  - [Supabase](https://supabase.com/) Backend Project
- #### Installation
  1. Run `npm install` to install packages
  2. Create an `.env` in the root (./) directory
     - You must have a [Discord Developer](https://discord.com/developers) account setup to obtain a bot token.
     - Developer mode must be enabled in your Discord Client to obtain your Guild and Client IDs.
     - Contents of the `.env` file:
  ```
  TOKEN = <Discord_Bot_Token>
  CLIENT_ID = <Owner_ID>
  SUPABASE_URL = <Supabase_Project_URL>
  SUPABASE_KEY = <Supabase_Service_Key>
  ```
  3. Run the bot with build scripts
- #### Build Scripts
  - `npm start` : Runs the code normally using ts-node.
  - `npm run dev` : Starts the ts-node-dev watcher and recompiles + runs code whenever a change is made.
  - `npm run build` : Compiles .TS files to .JS using TSC
- #### Structure
  - `./index.ts` contains handler routing and login
  - `./commands` contains individual commands
  - `./config` contains data storage/configuration
  - `./events` contains handlers for different events
  - `./interfaces` contains interfaces
  - `./utils` contains utility files

## Commands

- #### User Commands
  `/balance`
  `/claim`
  `/leaderboard`
  `/report`
- #### Member Commands
  `/pay`
- #### Officer Commands
  `/attendance`
  `/checkin`
  `/find`
  `/grant`
  `/memberships`
  `/ping`
  `/pruneexpiredmembers`
  `/rolegiver`
  `/setguildconfig`
  `/supabaseping`
  `/whois`
- #### Admin Commands
  `/cancelmembership`
  `/createcontact`
  `/grantmembership`
  `/updatecontact`

## Contributing

- #### Ideas
  - We want everyone to be able to help us in any way they can! Every idea is welcome, please open an issue describing what you have in mind first. We'll discuss your idea and we may add it to the bot! Feel free to also leave your thoughts!
- #### Bugs
  - Found a bug? Please let us know! Don't hesitate to write a bug report with as much information as possible!
  - Are you the exterminator type? Feel free to check out an existing bug report and see if you can find anything new and tell us what you've found.
