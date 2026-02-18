# Crowdfunding DApp

## Description

A decentralized application for browsing and donating to fundraising campaigns. Each campaign tracks donors and amounts. Users can create campaigns with details like project name, purpose, and refund rules if goals aren't met. Event tracking logs withdrawals by creators. Each fundraiser is a separate smart contract.

## Features

- Browse active fundraisers
- Donate to selected fundraisers
- Create new fundraisers with name, description, goal, and refund rules
- Track donations per user and campaign
- View personal donation history
- Creator-only fund withdrawal
- Event logs for transparency

## Tech Stack

- **Solidity:** Latest version (0.8.x)
- **Development:** Foundry for testing and deployment
- **Frontend:** Web3.js or ethers.js for wallet integration
- **Token:** USDC support via MetaMask

## Installation

1. Clone repo: `git clone [repo-url]`
2. Install Foundry: Follow official docs
3. Install dependencies: `forge install`
4. Set up `.env` for keys/testnets

## Usage

1. Connect MetaMask wallet
2. Browse or create fundraisers
3. Donate USDC to campaigns
4. Creators withdraw funds from their campaigns
5. View your donated fundraisers

## Deployment

1. Test locally with Foundry
2. Deploy to testnet (e.g., Sepolia) via Foundry scripts
3. Deploy to mainnet

## Contributing

Open to PRs. Fork, branch, and submit with tests.

## License

MIT
