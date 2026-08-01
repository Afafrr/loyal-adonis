interface StampProgressProps {
  collectedStamps: number;
  totalStamps: number;
}

export function StampProgress({ collectedStamps, totalStamps }: StampProgressProps) {
  return (
    <div className='mt-6'>
      <div className='flex items-baseline justify-between gap-4'>
        <p className='text-[13px] font-semibold text-foreground'>Your progress</p>
        <p className='text-[13px] font-semibold text-foreground-secondary'>
          {collectedStamps} / {totalStamps}
        </p>
      </div>
      <div aria-label={`${collectedStamps} of ${totalStamps} stamps collected`} className='mt-3 flex flex-wrap gap-2'>
        {Array.from({ length: totalStamps }, (_, index) => {
          const collected = index < collectedStamps;

          return (
            <span
              aria-hidden='true'
              className={`size-4 rounded-full border-2 ${
                collected ? 'border-stamp-filled bg-stamp-filled' : 'border-stamp-empty bg-panel'
              }`}
              key={index}
            />
          );
        })}
      </div>
      <p className='mt-3 text-[13px] leading-5 text-foreground-tertiary'>
        Collect stamps across any participating venue.
      </p>
    </div>
  );
}
