import { getLoyaltyColor } from '../_lib/loyalty-color';
import type { LoyaltyAccount } from '../_lib/loyalty-accounts';

export function RewardBalance({ loyaltyAccounts }: { loyaltyAccounts: LoyaltyAccount[] }) {
  const nextReward = findNextReward(loyaltyAccounts);

  if (!nextReward) {
    return null;
  }

  const showsProgress = nextReward.progressPercentage >= 60;
  const progressFill = showsProgress ? nextReward.progressPercentage : 0;
  const loyaltyColor = getLoyaltyColor(nextReward.companyId);
  const venueName = nextReward.venueName ?? nextReward.companyName;

  return (
    <section
      aria-label={`Closest reward at ${venueName}`}
      className={`relative min-h-52 overflow-hidden rounded-[26px] border border-line shadow-brand ${
        showsProgress ? loyaltyColor.backgroundClass : loyaltyColor.fillClass
      }`}
    >
      <div
        aria-hidden='true'
        className={`absolute inset-y-0 left-0 ${loyaltyColor.fillClass}`}
        style={{ width: `${progressFill}%` }}
      />

      <RewardContent inverted={!showsProgress} nextReward={nextReward} venueName={venueName} />

      {progressFill > 0 && (
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 overflow-hidden'
          style={{ clipPath: `inset(0 ${100 - progressFill}% 0 0)` }}
        >
          <RewardContent inverted nextReward={nextReward} venueName={venueName} />
        </div>
      )}
    </section>
  );
}

type NextReward = NonNullable<ReturnType<typeof findNextReward>>;

function RewardContent({
  inverted = false,
  nextReward,
  venueName,
}: {
  inverted?: boolean;
  nextReward: NextReward;
  venueName: string;
}) {
  return (
    <div className='relative flex min-h-52 h-full flex-col justify-center px-5 py-6 sm:px-12 sm:py-8'>
      <p
        className={`text-[10px] font-extrabold uppercase tracking-[0.14em] sm:text-xs ${
          inverted ? 'text-white/65' : 'text-foreground-label'
        }`}
      >
        Closest reward · {venueName}
      </p>
      <h2
        className={`mt-2 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl ${
          inverted ? 'text-white' : 'text-foreground'
        }`}
      >
        {nextReward.title}
      </h2>
      <p className={`mt-5 text-sm font-bold sm:text-[15px] ${inverted ? 'text-white/80' : 'text-foreground-secondary'}`}>
        {formatRewardProgress(nextReward)}
      </p>
    </div>
  );
}

function formatRewardProgress(nextReward: NextReward) {
  if (nextReward.remainingStamps === 0) {
    return `Reward ready · ${nextReward.collectedStamps}/${nextReward.totalStamps} stamps`;
  }

  const remainingLabel = nextReward.remainingStamps === 1 ? '1 stamp left' : `${nextReward.remainingStamps} stamps left`;
  return `${remainingLabel} · ${nextReward.collectedStamps}/${nextReward.totalStamps} stamps`;
}

function findNextReward(loyaltyAccounts: LoyaltyAccount[]) {
  return loyaltyAccounts.reduce<
    | {
        collectedStamps: number;
        companyId: number;
        companyName: string;
        progressPercentage: number;
        remainingStamps: number;
        title: string;
        totalStamps: number;
        venueName: string | null;
      }
    | undefined
  >((closestReward, account) => {
    const totalStamps = Math.max(account.program.stampsRequired, 1);
    const collectedStamps = Math.min(Math.max(account.program.stampCount, 0), totalStamps);
    const remainingStamps = totalStamps - collectedStamps;

    if (!closestReward || remainingStamps < closestReward.remainingStamps) {
      return {
        collectedStamps,
        companyId: account.company.id,
        companyName: account.company.name,
        progressPercentage: (collectedStamps / totalStamps) * 100,
        remainingStamps,
        title: account.program.rewardTitle,
        totalStamps,
        venueName: account.lastVisitedVenue?.name ?? null,
      };
    }

    return closestReward;
  }, undefined);
}
