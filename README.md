# Solana Discord BONKbot

BONKbot is a revolutionary trading bot designed specifically for the Solana ecosystem, bringing a new level of convenience and efficiency to crypto trading on Discord.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

```
MONGODB_URI= "mongodb+srv:// ..."
DISCORD_TOKEN = "MTI2 ..."
DEX_TOOL_TOKEN = "W1Gn ..."
QUIKNODE_RPC = "https://example.solana.quiknode.pro/000000/"
```

## Run Locally

Clone the project

```bash
  git clone https://github.com/c1ted/solanatradingbot.git
```

Go to the project directory

```bash
  cd solanatradingbot
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev

  or

  yarn dev

```

## Features

### Private DM interactions:

- /wallet show (shows your wallet)
- /wallet new (creates new wallet)
- /wallet export (shows private key)
- /wallet withdraw <enter solana wallet> <solana amount>
- /fees <allows you to change fee priority>

### Server interactions

- Monitors messages for contract addresses
- /buy <enter contract address> <solana amount>
  Example: /buy ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY 5 sol
- /sell <enter contract address> <solana amount>
  Example: /sell ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY 5 sol
- /portfolio (shows portfolio)

## Tech Stack

Node, Express, MongoDB, discord.js, @solana/web3

## Badges

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/) [![GPLv3 License](https://img.shields.io/badge/License-Flamingo-red.svg)](https://opensource.org/licenses/)

## Authors

- [Flamingo](https://www.github.com/gungho0619)

## Feedback

If you have any feedback, please reach out to me via [mail](tzztson@gmail.com) or [telegram](https://t.me/gungho0619)
