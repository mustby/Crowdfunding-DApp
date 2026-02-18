# PLAN.md — OpenRaise

## Development Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Design smart contracts (creation, donation, withdrawal, refunds) | ✅ Done |
| 2 | Implement contracts in Solidity with Foundry | ✅ Done |
| 3 | Write unit tests and test locally | ✅ Done |
| 4 | Build frontend: UI for browsing/creating/donating, MetaMask + USDC | ✅ Done |
| 5 | Add user views: My Campaigns, My Donations | ✅ Done |
| 6 | Add landing page with wallet-gated dashboard | ✅ Done |
| 7 | Rebrand to OpenRaise | ✅ Done |
| 8 | Push to GitHub, fix CI (forge fmt) | ✅ Done |
| 9 | Deploy to Sepolia testnet | ⬜ Up next |
| 10 | Test end-to-end on testnet | ⬜ Pending |
| 11 | Security audit | ⬜ Pending |
| 12 | Deploy to mainnet | ⬜ Pending |

---

## What Was Built

### Smart Contracts (`src/`)
- **`Fundraiser.sol`** — Per-campaign contract. Handles donations, deadline-based refunds, and creator withdrawal. Uses checks-effects-interactions pattern throughout.
- **`FundraiserFactory.sol`** — Deploys and tracks all `Fundraiser` contracts. One factory per deployment.
- **`MockUSDC.sol`** — Minimal ERC-20 with 6 decimals for local and Sepolia testing.
- **`Deploy.s.sol`** — Foundry broadcast script for Sepolia deployment.

### Tests (`test/`)
- **`Fundraiser.t.sol`** — 18 unit tests covering donations, withdrawals, refunds, factory tracking, view helpers, and constructor validation. All passing.

### Frontend (`frontend/`)
- **Stack:** Vite + React + Tailwind CSS + ethers.js v6
- **`LandingPage.jsx`** — Public-facing home page: hero, "How It Works" steps, trustless features. Shown until wallet connects.
- **`Header.jsx`** — Logo, wallet connect/disconnect, nav tabs (hidden on landing page).
- **`CampaignList.jsx`** — Fetches and displays all campaigns from the factory.
- **`CampaignCard.jsx`** — Campaign card with progress bar and status badge (Active / Goal Met / Expired / Funded).
- **`CampaignDetail.jsx`** — Full campaign view: donate form, creator withdraw button, donor refund button.
- **`CreateCampaign.jsx`** — Form to deploy a new Fundraiser via the factory.
- **`MyCampaigns.jsx`** — Filters campaigns by connected wallet's creator address.
- **`MyDonations.jsx`** — Filters campaigns where the connected wallet has donated.
- **`WalletContext.jsx`** — Global wallet state with MetaMask account/chain change listeners.
- **`mock.html`** — Standalone mock UI with full fake data for design review (no wallet needed).

### Utilities (`frontend/src/utils/`)
- **`abis.js`** — Contract ABIs for FundraiserFactory, Fundraiser, and ERC-20.
- **`addresses.js`** — Deployed contract addresses per chain (update after deploy).
- **`format.js`** — USDC formatting, time remaining, progress percent, address shortening.

---

## Team Roles / Operations

- **Solo developer:** Handle all aspects

## Testing Strategy

- Unit tests in Foundry (`forge test`) — 18/18 passing
- Local simulation via Anvil
- Testnet deployment and interactions (Sepolia)
- Mainnet after audit

## Security Considerations

- Checks-effects-interactions pattern used in all state-changing functions
- Custom errors for gas efficiency
- Audit required before mainnet deployment

## Next Steps

1. Deploy contracts to Sepolia testnet:
   ```bash
   forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
   ```
2. Update `frontend/src/utils/addresses.js` with the logged `MockUSDC` and `FundraiserFactory` addresses
3. Run the frontend locally:
   ```bash
   cd frontend && npm run dev
   ```

## Future Enhancements

TBD
