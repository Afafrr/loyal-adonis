import { cache } from 'react';
import { serverRoutes } from '@/lib/api/routes';
import { authenticatedFetch } from '@/lib/api/server-fetch';

export interface DashboardCompany {
  view: 'company';
  scope:
    | { type: 'company'; companyId: number }
    | { type: 'venue'; companyId: number; venueIds: number[] };
  company: {
    id: number;
    name: string;
    access: DashboardGrant[];
  };
  program: {
    id: number;
    name: string;
    rewardTitle: string;
    stampsRequired: number;
    active: boolean;
  } | null;
  venues: BusinessVenue[];
}

export interface BusinessVenue {
  id: number;
  name: string;
  category: string | null;
  city: string | null;
  addressLine1: string | null;
  access: DashboardGrant[];
}

interface DashboardGrant {
  role: 'admin' | 'company_owner' | 'venue_manager' | 'venue_staff';
  permissions: string[];
}

export interface DashboardCompanySelection {
  view: 'company_selection';
  companies: Array<{ id: number; name: string }>;
}

export interface EmptyDashboard {
  view: 'empty';
  companies: [];
}

export type Dashboard = DashboardCompany | DashboardCompanySelection | EmptyDashboard;

export interface DashboardStats {
  view: 'company';
  scope: DashboardCompany['scope'];
  stats: {
    customerCount: number | null;
    stampCount: number | null;
    earnedRewardCount: number | null;
    activeTagCount: number | null;
  };
  warnings: Array<{
    field: string;
    message: string;
  }>;
  period: {
    range: DashboardStatsRange;
    from: string;
    to: string;
    timezone: 'UTC';
    interval: 'day';
  };
  series: {
    stamps: Array<{ date: string; count: number }> | null;
  };
}

export const getDashboard = cache(async (filters: DashboardFilters = {}): Promise<Dashboard> => {
  const response = await authenticatedFetch(serverRoutes.api.businessDashboard(filters));
  return response.json() as Promise<Dashboard>;
});

export const getDashboardStats = cache(async (filters: DashboardStatsFilters): Promise<DashboardStats> => {
  const response = await authenticatedFetch(serverRoutes.api.businessDashboardStats(filters));
  return response.json() as Promise<DashboardStats>;
});

export interface DashboardFilters {
  companyId?: number;
  venueId?: number;
}

export type DashboardStatsRange = '7d' | '30d' | '90d';

export interface DashboardStatsFilters extends DashboardFilters {
  range?: DashboardStatsRange;
}

export function dashboardFilters(searchParams: {
  companyId?: string | string[];
  venueId?: string | string[];
}): DashboardFilters {
  return {
    companyId: positiveInteger(searchParams.companyId),
    venueId: positiveInteger(searchParams.venueId),
  };
}

export function dashboardStatsFilters(searchParams: {
  companyId?: string | string[];
  venueId?: string | string[];
  range?: string | string[];
}): DashboardStatsFilters {
  const range = firstValue(searchParams.range);

  return {
    ...dashboardFilters(searchParams),
    ...(range === '7d' || range === '30d' || range === '90d' ? { range } : {}),
  };
}

function positiveInteger(value: string | string[] | undefined) {
  const input = firstValue(value);
  if (!input || !/^\d+$/.test(input)) return undefined;

  const parsed = Number(input);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
