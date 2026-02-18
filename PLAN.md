# PLAN.md — Crowdfunding DApp

## Development Milestones

1. Design smart contracts for fundraisers (creation, donation, withdrawal, refunds)
2. Implement contracts in Solidity with Foundry
3. Test locally
4. Build frontend: UI for browsing/creating/donating, MetaMask integration for USDC
5. Add user views for donation history
6. Deploy to testnet
7. Test end-to-end
8. Deploy to mainnet

## Team Roles / Operations

- **Solo developer:** Handle all aspects

## Testing Strategy

- Unit tests in Foundry
- Local simulation
- Testnet deployment and interactions
- Mainnet after audit

## Frontend Integration

- Use Web3.js or ethers.js for contract calls
- Clean UI: Simple forms for non-crypto users
- MetaMask connect for USDC donations

## Oracle Usage

Not needed — all on-chain.

## Security Considerations

- Audit before mainnet deployment

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
