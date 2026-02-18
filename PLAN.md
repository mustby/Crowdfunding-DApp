# PLAN.md — OpenRaise

## Development Milestones

| #   | Milestone                                                          | Status    |
| --- | ------------------------------------------------------------------ | --------- |
| 1   | Design smart contracts (creation, donation, withdrawal, refunds)   | ✅ Done    |
| 2   | Implement contracts in Solidity with Foundry                       | ✅ Done    |
| 3   | Write unit tests and test locally                                  | ✅ Done    |
| 4   | Build frontend: UI for browsing/creating/donating, MetaMask + USDC | ✅ Done    |
| 5   | Add user views: My Campaigns, My Donations                         | ✅ Done    |
| 6   | Add landing page with wallet-gated dashboard                       | ✅ Done    |
| 7   | Rebrand to OpenRaise                                               | ✅ Done    |
| 8   | Push to GitHub, fix CI (forge fmt)                                 | ✅ Done    |
| 9   | Deploy to Sepolia testnet                                          | ⬜ Up next |
| 10  | Test end-to-end on testnet                                         | ⬜ Pending |
| 11  | Security audit                                                     | ⬜ Pending |
| 12  | Deploy to mainnet                                                  | ⬜ Pending |

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

## Open Questions & Design Decisions

### 💰 Revenue / Platform Fee
- How does OpenRaise generate money?
- **Option A:** Take a small % fee (e.g. 1–2%) on successful withdrawals — deducted at the time the creator calls `withdraw()`.
- **Option B:** Flat fee per campaign creation — charged in USDC when `createFundraiser()` is called.
- **Option C:** No fee — pure public good / open source, monetize later.
- Fee logic would live in `FundraiserFactory.sol` (collected by a `feeRecipient` address set by the deployer).
- **Decision needed:** Pick a model before mainnet. A withdrawal fee is the most "aligned" — we only earn when creators succeed.

---

### 📈 Over-funded Campaigns
- Current behavior: donations are accepted even after the goal is met (no cap). `totalRaised` can exceed `goalAmount`.
- **Is this intentional?** Probably yes — Kickstarter-style over-funding is a good signal of community support.
- If we keep it: UI should display "107% funded" style progress (already does this).
- If we want a hard cap: add a `require(totalRaised + amount <= goalAmount)` check in `donate()`.
- **Decision needed:** Keep over-funding allowed (recommended) or add a hard cap?

---

### ⏱️ Early Withdrawal
- Currently creators can only withdraw once the goal is met, at any time (before or after deadline).
- Should creators be allowed to withdraw early (before deadline) even if goal is met?
  - **Yes (current behavior):** Flexible, creator-friendly.
  - **No:** Force creator to wait until deadline so donors can see campaign run to completion.
- **Decision needed:** Current behavior is probably fine. Worth confirming.

---

### ❌ Campaign Cancellation
- Can a creator cancel a campaign early and trigger refunds before the deadline?
- Not currently supported — creators cannot cancel.
- Would require a `cancel()` function that sets a `cancelled` flag, stops donations, and allows donor refunds.
- **Decision needed:** Add cancel functionality? Useful for mistakes (wrong goal amount, typo in description).

---

### ✏️ Campaign Editing
- Once deployed, campaign name/description/goal/deadline are immutable (set in constructor).
- Should creators be able to edit any fields post-deployment?
- On-chain edits are possible but add complexity and gas. Off-chain metadata (IPFS) is an alternative.
- **Decision needed:** Keep immutable for now (simpler, more trustworthy). Revisit for v2.

---

### 🪙 Multi-Token Support
- Currently USDC-only. The USDC address is set at factory deployment and shared by all campaigns.
- Should creators be able to choose any ERC-20 token for their campaign?
- Would require storing `tokenAddress` per `Fundraiser` and updating the factory.
- **Decision needed:** USDC-only keeps UX simple and avoids token valuation complexity. Good for v1.

---

### 🌐 Frontend Hosting
- Where does the frontend live in production?
  - **Vercel / Netlify:** Easy, fast, centralized.
  - **IPFS + ENS:** Fully decentralized, matches the ethos of the project.
- **Decision needed:** Vercel for testnet launch, IPFS for mainnet.

---

### 🛡️ Spam / Abuse Prevention
- Anyone with a wallet can create a campaign — no filtering.
- Could add a minimum goal amount or a small USDC deposit to create a campaign (refunded on success).
- **Decision needed:** No restrictions for v1. Revisit if spam becomes an issue.

## Future Enhancements

- Platform fee on successful withdrawals
- Campaign cancellation by creator
- IPFS/ENS frontend hosting for full decentralization
- Multi-token support (beyond USDC)
- Campaign categories / tags for discoverability
- Social sharing cards per campaign
- Email/push notifications via EPNS or similar
