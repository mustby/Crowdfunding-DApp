import { useWallet } from '../context/WalletContext';
import { shortAddress } from '../utils/format';

const SEPOLIA_CHAIN_ID = 11155111;

const NAV_ITEMS = [
  { id: 'browse', label: 'Browse Campaigns' },
  { id: 'create', label: 'Create Campaign' },
  { id: 'my-campaigns', label: 'My Campaigns' },
  { id: 'my-donations', label: 'My Donations' },
];

export default function Header({ view, setView }) {
  const { account, chainId, connect, disconnect } = useWallet();
  const wrongNetwork = account && chainId !== SEPOLIA_CHAIN_ID;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <span
            className="text-xl font-bold text-indigo-600 cursor-pointer"
            onClick={() => setView('browse')}
          >
            Crowdfund DApp
          </span>

          <div className="flex items-center gap-3">
            {wrongNetwork && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                Wrong network — switch to Sepolia
              </span>
            )}
            {account ? (
              <button
                onClick={disconnect}
                className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition text-gray-700"
              >
                {shortAddress(account)}
              </button>
            ) : (
              <button
                onClick={connect}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        <nav className="flex gap-6">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                view === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
