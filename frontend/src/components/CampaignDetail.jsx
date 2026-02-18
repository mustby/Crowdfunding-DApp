import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { FUNDRAISER_ABI, ERC20_ABI } from '../utils/abis';
import { formatUSDC, parseUSDC, formatDeadline, timeRemaining, progressPercent, shortAddress } from '../utils/format';

export default function CampaignDetail({ address, onBack }) {
  const { provider, signer, account } = useWallet();
  const [campaign, setCampaign] = useState(null);
  const [myDonation, setMyDonation] = useState(0n);
  const [donateAmount, setDonateAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);

  const loadCampaign = useCallback(async () => {
    if (!provider) return;
    try {
      const c = new ethers.Contract(address, FUNDRAISER_ABI, provider);
      const [
        name, description, creator, goalAmount, deadline,
        totalRaised, withdrawn, cancelled, goalMet, expired, usdcAddr, feeBps,
      ] = await Promise.all([
        c.name(), c.description(), c.creator(), c.goalAmount(), c.deadline(),
        c.totalRaised(), c.withdrawn(), c.cancelled(), c.isGoalMet(), c.isExpired(), c.usdc(), c.feeBps(),
      ]);
      setCampaign({ address, name, description, creator, goalAmount, deadline, totalRaised, withdrawn, cancelled, goalMet, expired, usdcAddr, feeBps });

      if (account) {
        setMyDonation(await c.donations(account));
      }
    } catch (err) {
      setError(err.message);
    }
  }, [provider, address, account]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  async function handleDonate(e) {
    e.preventDefault();
    if (!signer || !campaign) return;
    setLoading(true);
    setTxStatus(null);
    setError(null);
    try {
      const amount = parseUSDC(donateAmount);
      const usdc = new ethers.Contract(campaign.usdcAddr, ERC20_ABI, signer);
      const fundraiser = new ethers.Contract(address, FUNDRAISER_ABI, signer);

      const allowance = await usdc.allowance(account, address);
      if (allowance < amount) {
        setTxStatus('Approving USDC... (confirm in MetaMask)');
        const approveTx = await usdc.approve(address, amount);
        await approveTx.wait();
      }

      setTxStatus('Sending donation... (confirm in MetaMask)');
      const tx = await fundraiser.donate(amount);
      await tx.wait();

      setTxStatus('Donation successful!');
      setDonateAmount('');
      await loadCampaign();
    } catch (err) {
      setError(err.reason ?? err.message);
      setTxStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!signer) return;
    setLoading(true);
    setTxStatus(null);
    setError(null);
    try {
      const fundraiser = new ethers.Contract(address, FUNDRAISER_ABI, signer);
      setTxStatus('Withdrawing funds... (confirm in MetaMask)');
      const tx = await fundraiser.withdraw();
      await tx.wait();
      setTxStatus('Withdrawal successful!');
      await loadCampaign();
    } catch (err) {
      setError(err.reason ?? err.message);
      setTxStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!signer) return;
    setLoading(true);
    setTxStatus(null);
    setError(null);
    try {
      const fundraiser = new ethers.Contract(address, FUNDRAISER_ABI, signer);
      setTxStatus('Cancelling campaign... (confirm in MetaMask)');
      const tx = await fundraiser.cancel();
      await tx.wait();
      setTxStatus('Campaign cancelled. Donors can now claim refunds.');
      await loadCampaign();
    } catch (err) {
      setError(err.reason ?? err.message);
      setTxStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund() {
    if (!signer) return;
    setLoading(true);
    setTxStatus(null);
    setError(null);
    try {
      const fundraiser = new ethers.Contract(address, FUNDRAISER_ABI, signer);
      setTxStatus('Claiming refund... (confirm in MetaMask)');
      const tx = await fundraiser.claimRefund();
      await tx.wait();
      setTxStatus('Refund claimed successfully!');
      await loadCampaign();
    } catch (err) {
      setError(err.reason ?? err.message);
      setTxStatus(null);
    } finally {
      setLoading(false);
    }
  }

  if (error && !campaign) {
    return <div className="text-center py-24 text-red-500 text-sm">{error}</div>;
  }

  if (!campaign) {
    return <div className="text-center py-24 text-gray-400">Loading campaign...</div>;
  }

  const pct = progressPercent(campaign.totalRaised, campaign.goalAmount);
  const isCreator = account?.toLowerCase() === campaign.creator.toLowerCase();
  const canDonate = !campaign.expired && !campaign.withdrawn && !campaign.cancelled;
  const canWithdraw = isCreator && campaign.goalMet && !campaign.withdrawn && !campaign.cancelled;
  const canCancel = isCreator && !campaign.cancelled && !campaign.withdrawn;
  const canRefund = myDonation > 0n && (campaign.cancelled || (campaign.expired && !campaign.goalMet));

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition"
      >
        ← Back to campaigns
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{campaign.name}</h2>
          <p className="text-sm text-gray-400">by {shortAddress(campaign.creator)}</p>
        </div>

        <p className="text-gray-600">{campaign.description}</p>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-gray-900">${formatUSDC(campaign.totalRaised)} raised</span>
            <span className="text-gray-500">{pct}% of ${formatUSDC(campaign.goalAmount)}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${campaign.goalMet ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {campaign.expired
              ? `Ended ${formatDeadline(campaign.deadline)}`
              : timeRemaining(campaign.deadline)}
          </p>
        </div>

        {/* My donation info */}
        {myDonation > 0n && (
          <div className="bg-indigo-50 rounded-lg px-4 py-3 text-sm text-indigo-700">
            You have donated <strong>${formatUSDC(myDonation)}</strong> to this campaign.
          </div>
        )}

        {/* Status feedback */}
        {txStatus && <p className="text-sm text-indigo-600 font-medium">{txStatus}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Donate form */}
        {canDonate && account && (
          <form onSubmit={handleDonate} className="flex gap-3">
            <input
              type="number"
              value={donateAmount}
              onChange={(e) => setDonateAmount(e.target.value)}
              required
              min="0.000001"
              step="0.000001"
              placeholder="Amount in USDC"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
            >
              {loading ? 'Sending...' : 'Donate'}
            </button>
          </form>
        )}

        {/* Wallet not connected nudge */}
        {canDonate && !account && (
          <p className="text-sm text-gray-400 text-center">Connect your wallet to donate.</p>
        )}

        {/* Creator withdraw */}
        {canWithdraw && (
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Platform fee ({Number(campaign.feeBps) / 100}%)</span>
                <span className="text-gray-500">-${formatUSDC((campaign.totalRaised * campaign.feeBps) / 10000n)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900">
                <span>You will receive</span>
                <span>${formatUSDC(campaign.totalRaised - (campaign.totalRaised * campaign.feeBps) / 10000n)}</span>
              </div>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
            >
              {loading ? 'Withdrawing...' : `Withdraw $${formatUSDC(campaign.totalRaised - (campaign.totalRaised * campaign.feeBps) / 10000n)}`}
            </button>
          </div>
        )}

        {/* Donor refund */}
        {canRefund && (
          <button
            onClick={handleRefund}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            {loading ? 'Claiming...' : `Claim Refund ($${formatUSDC(myDonation)})`}
          </button>
        )}

        {/* Creator cancel */}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-300 font-medium py-2.5 rounded-lg transition text-sm"
          >
            {loading ? 'Cancelling...' : 'Cancel Campaign'}
          </button>
        )}

        {/* Cancelled state */}
        {campaign.cancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-center">
            This campaign was cancelled by the creator. Donors can claim their refunds above.
          </div>
        )}

        {/* Funded / withdrawn state */}
        {campaign.withdrawn && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-500 text-center">
            This campaign was successfully funded and withdrawn by the creator.
          </div>
        )}
      </div>
    </div>
  );
}
