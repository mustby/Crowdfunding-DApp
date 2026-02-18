import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { FACTORY_ABI } from '../utils/abis';
import { getAddresses } from '../utils/addresses';
import { parseUSDC } from '../utils/format';

export default function CreateCampaign({ onCreated }) {
  const { signer, chainId } = useWallet();
  const [form, setForm] = useState({ name: '', description: '', goal: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const minDate = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]; // tomorrow min

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!signer) return;
    setLoading(true);
    setError(null);
    try {
      const addrs = getAddresses(chainId);
      if (!addrs) throw new Error(`No contracts deployed on chain ${chainId}.`);

      const factory = new ethers.Contract(addrs.factory, FACTORY_ABI, signer);
      const goalAmount = parseUSDC(form.goal);
      const deadline = Math.floor(new Date(form.deadline).getTime() / 1000);

      const tx = await factory.createFundraiser(form.name, form.description, goalAmount, deadline);
      await tx.wait();
      onCreated();
    } catch (err) {
      setError(err.reason ?? err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!signer) {
    return (
      <div className="text-center py-24 text-gray-400">
        Connect your wallet to create a campaign.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a Campaign</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            maxLength={80}
            placeholder="e.g. Fund my open-source project"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            maxLength={500}
            placeholder="Describe your campaign and how funds will be used..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal Amount (USDC)</label>
          <input
            name="goal"
            value={form.goal}
            onChange={handleChange}
            required
            type="number"
            min="1"
            step="0.000001"
            placeholder="1000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
          <input
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            required
            type="date"
            min={minDate}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          {loading ? 'Creating Campaign...' : 'Create Campaign'}
        </button>
      </form>
    </div>
  );
}
