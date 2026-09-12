export default function OwnerDashboardLoading() {
  return (
    <section className='mx-auto max-w-5xl animate-pulse px-4 pb-12 pt-8 sm:px-12 md:px-10'>
      <div className='h-3 w-24 rounded-full bg-panel-muted' />
      <div className='mt-4 h-11 w-64 rounded-xl bg-panel-muted' />
      <div className='mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <div className='h-32 rounded-dashboard-card bg-panel-muted' key={index} />
        ))}
      </div>
      <div className='mt-8 grid gap-5 lg:grid-cols-2'>
        <div className='h-56 rounded-dashboard-card bg-panel-muted' />
        <div className='h-56 rounded-dashboard-card bg-panel-muted' />
      </div>
    </section>
  );
}
