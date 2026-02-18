import { useWallet } from '../context/WalletContext';

const HOW_IT_WORKS = [
  {
    emoji: '🚀',
    step: 'Step 1',
    title: 'Create a Campaign',
    desc: 'Set your project name, description, USDC goal, and a funding deadline.',
  },
  {
    emoji: '💸',
    step: 'Step 2',
    title: 'Donate with USDC',
    desc: 'Browse active campaigns and donate any amount of USDC directly from your wallet.',
  },
  {
    emoji: '📈',
    step: 'Step 3',
    title: 'Track Progress',
    desc: 'Watch campaigns grow in real time. Every donation is recorded on-chain and fully transparent.',
  },
  {
    emoji: '✅',
    step: 'Step 4',
    title: 'Withdraw or Get Refunded',
    desc: "Creators withdraw when goals are met. Donors are automatically refunded if a campaign expires short of its goal.",
  },
];

const WHY_TRUSTLESS = [
  {
    emoji: '🔒',
    title: 'Non-Custodial',
    desc: 'Funds are held in smart contracts — never by us. Only the contract rules decide who gets paid.',
  },
  {
    emoji: '⚡',
    title: 'Instant Refunds',
    desc: "If a campaign doesn't hit its goal by the deadline, donors can claim refunds immediately — no forms, no waiting.",
  },
  {
    emoji: '🌐',
    title: 'Fully On-Chain',
    desc: 'Every campaign, donation, and withdrawal is recorded on Ethereum. Anyone can verify the history at any time.',
  },
];

export default function LandingPage() {
  const { connect } = useWallet();

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            Powered by USDC on Ethereum
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Decentralized Crowdfunding,<br className="hidden sm:block" /> Built on Trust
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Create campaigns, donate with USDC, and get refunded automatically if a goal isn&apos;t
            met — no middlemen, no hidden fees, fully on-chain.
          </p>
          <button
            onClick={connect}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition shadow-sm"
          >
            Connect Wallet to Get Started
          </button>
          <p className="text-xs text-gray-400 mt-3">Requires MetaMask · Sepolia Testnet</p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">How It Works</h2>
        <p className="text-gray-500 text-center mb-10 text-sm">Four simple steps from idea to funding.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map(({ emoji, step, title, desc }) => (
            <div key={step} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl">
                {emoji}
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">{step}</p>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why trustless */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-14 grid gap-6 sm:grid-cols-3 text-center">
          {WHY_TRUSTLESS.map(({ emoji, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{emoji}</span>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
