import { ethers } from 'ethers';

export function formatUSDC(amount) {
  return Number(ethers.formatUnits(amount, 6)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseUSDC(amount) {
  return ethers.parseUnits(String(amount), 6);
}

export function formatDeadline(timestamp) {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeRemaining(deadline) {
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(deadline) - now;
  if (remaining <= 0) return 'Expired';
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

export function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function progressPercent(totalRaised, goalAmount) {
  if (!goalAmount || goalAmount === 0n) return 0;
  return Math.min(100, Number((totalRaised * 100n) / goalAmount));
}
