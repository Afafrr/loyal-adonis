type StampProgressProps = {
  collectedStamps: number;
  filledStampClass: string;
  totalStamps: number;
};

export function StampProgress({ collectedStamps, filledStampClass, totalStamps }: StampProgressProps) {
  const progressPercentage = Math.min(Math.max((collectedStamps / totalStamps) * 100, 0), 100);
  const remainingStamps = totalStamps - collectedStamps;

  return (
    <div className='mt-6'>
      <div aria-label={`${collectedStamps} of ${totalStamps} stamps collected`} className='mt-3 flex flex-wrap gap-2'>
        {Array.from({ length: totalStamps }, (_, index) => {
          const collected = index < collectedStamps;

          return (
            <span
              aria-hidden='true'
              className={`grid size-6 place-items-center rounded-full lg:size-7 ${
                collected
                  ? filledStampClass
                  : 'border-[1.5px] border-dashed border-stamp-empty bg-panel text-[10px] font-medium leading-none text-foreground-label lg:text-[11px]'
              }`}
              key={index}
            >
              {collected ? null : totalStamps - index}
            </span>
          );
        })}
      </div>
      <div
        aria-label={`${collectedStamps} of ${totalStamps} stamps collected`}
        aria-valuemax={totalStamps}
        aria-valuemin={0}
        aria-valuenow={collectedStamps}
        className='mt-4 h-2 overflow-hidden rounded-full bg-panel-muted'
        role='progressbar'
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${filledStampClass}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className='mt-2 text-xs font-semibold text-foreground-secondary sm:hidden'>
        {remainingStamps === 0
          ? 'Reward ready'
          : `${remainingStamps} ${remainingStamps === 1 ? 'stamp' : 'stamps'} to go`}
      </p>
    </div>
  );
}
