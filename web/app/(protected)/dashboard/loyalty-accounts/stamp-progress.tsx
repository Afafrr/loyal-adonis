interface StampProgressProps {
  collectedStamps: number;
  totalStamps: number;
}

export function StampProgress({ collectedStamps, totalStamps }: StampProgressProps) {
  return (
    <div className='mt-6'>
      <div className='flex items-baseline justify-between gap-4'>
        <p className='text-[13px] font-semibold text-[#202a25]'>Your progress</p>
        <p className='text-[13px] font-semibold text-[#536059]'>
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
                collected ? 'border-[#1f2924] bg-[#1f2924]' : 'border-[#c8d0cb] bg-white'
              }`}
              key={index}
            />
          );
        })}
      </div>
      <p className='mt-3 text-[13px] leading-5 text-[#657069]'>
        Collect stamps across any participating venue.
      </p>
    </div>
  );
}
