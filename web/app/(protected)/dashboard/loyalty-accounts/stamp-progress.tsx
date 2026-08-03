interface StampProgressProps {
  collectedStamps: number;
  filledStampClass: string;
  totalStamps: number;
}

export function StampProgress({ collectedStamps, filledStampClass, totalStamps }: StampProgressProps) {
  return (
    <div className='mt-6'>
      <div className='flex items-baseline justify-between gap-4'>
        <p className='text-[13px] font-semibold text-foreground sm:text-sm'>Your progress</p>
        <p className='text-[13px] font-semibold text-foreground-secondary sm:text-sm'>
          {collectedStamps} / {totalStamps}
        </p>
      </div>
      <div aria-label={`${collectedStamps} of ${totalStamps} stamps collected`} className='mt-3 flex flex-wrap gap-2'>
        {Array.from({ length: totalStamps }, (_, index) => {
          const collected = index < collectedStamps;

          return (
            <span
              aria-hidden='true'
              className={`size-6 rounded-full ${
                collected ? filledStampClass : 'border-2 border-stamp-empty bg-panel'
              }`}
              key={index}
            />
          );
        })}
      </div>
      <p className='mt-3 text-[11px] leading-5 text-foreground-tertiary sm:text-xs'>
        Collect stamps across any participating venue.
      </p>
    </div>
  );
}
