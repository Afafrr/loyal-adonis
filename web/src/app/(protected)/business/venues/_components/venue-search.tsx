'use client';

import { useMemo, useState } from 'react';
import { MapPinIcon } from '@/components/ui/icons';
import type { BusinessVenue } from '../../dashboard/_lib/dashboard';

export function VenueSearch({ venues }: { venues: BusinessVenue[] }) {
  const [query, setQuery] = useState('');
  const matchingVenues = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return venues;

    return venues.filter((venue) =>
      [venue.name, venue.category, venue.city, venue.addressLine1]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [query, venues]);

  return (
    <>
      <label className='mt-7 block max-w-md'>
        <span className='sr-only'>Search venues</span>
        <input
          className='w-full rounded-xl border border-line-subtle bg-panel px-4 py-3 text-sm font-medium outline-none transition placeholder:text-foreground-muted focus:border-brand'
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Search venues by name or location'
          type='search'
          value={query}
        />
      </label>

      <div className='mt-5 divide-y divide-line-faint rounded-dashboard-card border border-line-subtle bg-panel px-5 shadow-card sm:px-7'>
        {matchingVenues.length > 0 ? (
          matchingVenues.map((venue) => {
            const location = [venue.addressLine1, venue.city].filter(Boolean).join(', ');

            return (
              <div className='flex items-center gap-4 py-4' key={venue.id}>
                <span className='grid size-11 shrink-0 place-items-center rounded-full bg-panel-muted text-foreground-tertiary'>
                  <MapPinIcon className='size-5' />
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-bold'>{venue.name}</p>
                  <p className='mt-0.5 truncate text-sm text-foreground-secondary'>
                    {location || venue.category || 'Location details unavailable'}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className='py-8 text-center text-sm text-foreground-muted'>No venues match your search.</p>
        )}
      </div>
    </>
  );
}
