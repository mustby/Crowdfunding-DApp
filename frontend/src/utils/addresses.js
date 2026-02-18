// Update these addresses after deploying with:
//   forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
//
// Then paste the logged addresses below.

const ADDRESSES = {
  // Sepolia testnet (chainId 11155111)
  11155111: {
    factory: '0x0000000000000000000000000000000000000000', // TODO
    usdc: '0x0000000000000000000000000000000000000000',   // TODO
  },
  // Anvil local devnet (chainId 31337)
  31337: {
    factory: '0x0000000000000000000000000000000000000000', // TODO
    usdc: '0x0000000000000000000000000000000000000000',   // TODO
  },
};

const ZERO = '0x0000000000000000000000000000000000000000';

export function getAddresses(chainId) {
  const addrs = ADDRESSES[chainId];
  if (!addrs || addrs.factory === ZERO) return null;
  return addrs;
}
