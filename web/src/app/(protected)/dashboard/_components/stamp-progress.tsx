type StampProgressProps = {
  collectedStamps: number;
  filledStampClass: string;
  totalStamps: number;
};

export function StampProgress({ collectedStamps, filledStampClass, totalStamps }: StampProgressProps) {
  return (
    <div className='mt-6'>
      <div className='flex items-baseline justify-between gap-4'>
        <p className='text-[13px] font-semibold text-foreground sm:text-sm lg:text-[13px]'>Your progress</p>
        <p className='text-[13px] font-semibold text-foreground-secondary sm:text-sm lg:text-[13px]'>
          {collectedStamps} / {totalStamps}
        </p>
      </div>
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
    </div>
  );
}
