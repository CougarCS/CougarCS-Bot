# 📦CougarCS-Bot!

# Introduction
This documentation . . .

## Status
Status content here

## Glossary
Glossary content here

# Requirements
- Requirement 1
- Requirement 2
- [Link here](https://dummyjson.com/)

# File Structure
📦:.
│   .dockerignore
│   .env
│   .env.example
│   .eslintrc.json
│   .gitignore
│   Dockerfile
│   package-lock.json
│   package.json
│   README.md
│   tsconfig.json
│
├───.github
│   └───workflows
│           aws.yml
│           task-definition.json
│
└───src
    │   index.ts
    │
    ├───commands
    │   ├───admin-commands
    │   │       cancel-membership.ts
    │   │       create-contact.ts
    │   │       grant-membership.ts
    │   │       update-contact.ts
    │   │
    │   ├───member-commands
    │   │       pay.ts
    │   │
    │   ├───officer-commands
    │   │       appoint-tutor.ts
    │   │       attendance.ts
    │   │       checkin.ts
    │   │       find.ts
    │   │       grant.ts
    │   │       memberships.ts
    │   │       ping.ts
    │   │       prune-members.ts
    │   │       role-giver.ts
    │   │       set-guild-config.ts
    │   │       supabase-ping.ts
    │   │       whois.ts
    │   │
    │   ├───tutor-commands
    │   │       tutor-leaderboard.ts
    │   │       tutor-log.ts
    │   │       tutor-stats.ts
    │   │
    │   └───user-commands
    │           balance.ts
    │           claim.ts
    │           create-profile.ts
    │           leaderboard.ts
    │           report.ts
    │           update-profile.ts
    │
    ├───config
    │       config.json
    │       intentOptions.ts
    │
    ├───events
    │       interaction.ts
    │       ready.ts
    │
    ├───interfaces
    │       Command.ts
    │
    └───utils
            embeded.ts
            embedFields.ts
            heartbeat.ts
            logs.ts
            options.ts
            reactions.ts
            schema.ts
            supabase.ts
            types.ts
            validateEnv.ts
            _Commandlists.ts


# Bot Commands

### Command 1
>#### Purpose
>- This command does x and returns nothing

>#### Permissions
>- You must have

>#### Arguments
>- This command takes in

>#### Example
>- ``func(arg1, arg2)``

### Command 2
>#### Purpose
>- This command does **y** and returns something

>#### Permissions
>- You must have

>#### Arguments
>- This command takes in

>#### Example
>- ``func2(arg1, arg2)``

### Command 3
>#### Purpose
>- This command does z and is a HOF

>#### Permissions
>- You must have

>#### Arguments
>- This command takes in 

>#### Example
>- ``func3(arg1, arg2)``

# Bot Events

Bot eventing

# Testing

Here is how you test

# Utils

You need these

# Admin Commands

>Admin commands are used only by those with 'Admin' role in discord

|  Command       |          Example              |Purpose                      |
|----------------|-------------------------------|-----------------------------|
|Cancel Membership|`command()`|Membership will be suspended and persist in database.|
|Create Contact   |`command()`|A contact will be created.|
|Grant Membership |`command()`|Membership will be granted for a period of time.|
|Update Contact   |`command()`|A contact will be updated.|

# Officer Commands
Officers can do the following

# Tutor Commands
Tutors can do the following

# Member Commands
List of member commands

# User Commands
Any user can do the following



