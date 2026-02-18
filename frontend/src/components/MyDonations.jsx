import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { FACTORY_ABI, FUNDRAISER_ABI } from '../utils/abis';
import { getAddresses } from '../utils/addresses';
import CampaignCard from './CampaignCard';

export default function MyDonations({ onSelect }) {
  const { provider, account, chainId } = useWallet();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMyDonations = useCallback(async () => {
    if (!provider || !account || !chainId) return;
    setLoading(true);
    try {
      const addrs = getAddresses(chainId);
      if (!addrs) return;

      const factory = new ethers.Contract(addrs.factory, FACTORY_ABI, provider);
      const allAddresses = await factory.getFundraisers();

      const results = await Promise.all(
        allAddresses.map(async (addr) => {
          const c = new ethers.Contract(addr, FUNDRAISER_ABI, provider);
          const [
            donation, name, description, creator,
            goalAmount, deadline, totalRaised, withdrawn, goalMet, expired,
          ] = await Promise.all([
            c.donations(account),
            c.name(), c.description(), c.creator(),
            c.goalAmount(), c.deadline(), c.totalRaised(),
            c.withdrawn(), c.isGoalMet(), c.isExpired(),
          ]);
          if (donation === 0n) return null;
          return { address: addr, name, description, creator, goalAmount, deadline, totalRaised, withdrawn, goalMet, expired };
        })
      );

      setCampaigns(results.filter(Boolean).reverse());
    } finally {
      setLoading(false);
    }
  }, [provider, account, chainId]);

  useEffect(() => {
    loadMyDonations();
  }, [loadMyDonations]);

  if (!account) {
    return (
      <div className="text-center py-24 text-gray-400">
        Connect your wallet to view your donations.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-24 text-gray-400">Loading your donations...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Donations</h2>
        <button onClick={loadMyDonations} className="text-sm text-indigo-600 hover:underline">
          Refresh
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          You haven&apos;t donated to any campaigns yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.address} campaign={c} onClick={() => onSelect(c.address)} />
          ))}
        </div>
      )}
    </div>
  );
}
