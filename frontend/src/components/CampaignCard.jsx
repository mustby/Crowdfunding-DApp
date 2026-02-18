import { formatUSDC, formatDeadline, timeRemaining, progressPercent } from '../utils/format';

function StatusBadge({ goalMet, expired, withdrawn, cancelled }) {
  if (cancelled)
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full whitespace-nowrap">
        Cancelled
      </span>
    );
  if (withdrawn)
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full whitespace-nowrap">
        Funded
      </span>
    );
  if (goalMet)
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full whitespace-nowrap">
        Goal Met
      </span>
    );
  if (expired)
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full whitespace-nowrap">
        Expired
      </span>
    );
  return (
    <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full whitespace-nowrap">
      Active
    </span>
  );
}

export default function CampaignCard({ campaign, onClick }) {
  const { name, description, goalAmount, totalRaised, deadline, goalMet, expired, withdrawn, cancelled } =
    campaign;
  const pct = progressPercent(totalRaised, goalAmount);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 leading-tight">{name}</h3>
        <StatusBadge goalMet={goalMet} expired={expired} withdrawn={withdrawn} cancelled={cancelled} />
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 flex-1">{description}</p>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>${formatUSDC(totalRaised)} raised</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${goalMet ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>Goal: ${formatUSDC(goalAmount)}</span>
        <span>{expired ? `Ended ${formatDeadline(deadline)}` : timeRemaining(deadline)}</span>
      </div>
    </div>
  );
}
