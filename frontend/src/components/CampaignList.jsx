import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { FACTORY_ABI, FUNDRAISER_ABI } from '../utils/abis';
import { getAddresses } from '../utils/addresses';
import CampaignCard from './CampaignCard';

async function fetchCampaignData(address, provider) {
  const c = new ethers.Contract(address, FUNDRAISER_ABI, provider);
  const [name, description, creator, goalAmount, deadline, totalRaised, withdrawn, goalMet, expired] =
    await Promise.all([
      c.name(),
      c.description(),
      c.creator(),
      c.goalAmount(),
      c.deadline(),
      c.totalRaised(),
      c.withdrawn(),
      c.isGoalMet(),
      c.isExpired(),
    ]);
  return { address, name, description, creator, goalAmount, deadline, totalRaised, withdrawn, goalMet, expired };
}

export default function CampaignList({ onSelect }) {
  const { provider, chainId } = useWallet();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCampaigns = useCallback(async () => {
    if (!provider || !chainId) return;
    setLoading(true);
    setError(null);
    try {
      const addrs = getAddresses(chainId);
      if (!addrs) {
        setError(`No contracts deployed on chain ${chainId}. Update src/utils/addresses.js.`);
        return;
      }
      const factory = new ethers.Contract(addrs.factory, FACTORY_ABI, provider);
      const fundraiserAddresses = await factory.getFundraisers();
      const data = await Promise.all(
        fundraiserAddresses.map((addr) => fetchCampaignData(addr, provider))
      );
      setCampaigns([...data].reverse()); // newest first
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [provider, chainId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  if (!provider) {
    return (
      <div className="text-center py-24 text-gray-400">
        Connect your wallet to browse campaigns.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-24 text-gray-400">Loading campaigns...</div>;
  }

  if (error) {
    return <div className="text-center py-24 text-red-500 text-sm">{error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
        <button
          onClick={loadCampaigns}
          className="text-sm text-indigo-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          No campaigns yet. Be the first to create one!
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
