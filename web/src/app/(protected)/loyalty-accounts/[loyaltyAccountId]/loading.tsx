export default function LoyaltyAccountLoading() {
  return (
    <section className='mx-auto max-w-4xl animate-pulse px-4 pb-12 pt-2 min-[380px]:px-5 sm:px-12 sm:pt-6 md:px-10'>
      <div className='h-4 w-24 rounded bg-line-faint' />
      <div className='mt-8 flex items-center gap-6'>
        <div className='size-20 shrink-0 rounded-full bg-line-faint sm:size-24' />
        <div className='flex-1 space-y-3'>
          <div className='h-3 w-24 rounded bg-line-faint' />
          <div className='h-9 max-w-sm rounded bg-line-faint' />
          <div className='h-4 max-w-xs rounded bg-line-faint' />
        </div>
      </div>
      <div className='mt-10 space-y-8'>
        <div className='h-72 rounded-dashboard-card bg-panel' />
        <div className='h-52 rounded-dashboard-card bg-panel' />
        <div className='h-64 rounded-dashboard-card bg-panel' />
      </div>
    </section>
  );
}
