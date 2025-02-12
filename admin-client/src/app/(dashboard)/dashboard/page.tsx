'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/services/auth';
import { getAnalyticsStats } from '@/lib/services/analytics';
import type { AnalyticsStats } from '@/lib/services/analytics';
import Loading from '@/components/ui/loading';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    // Fetch dashboard data
    const fetchStats = async () => {
      try {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days
        const data = await getAnalyticsStats(startDate, endDate);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome to your admin dashboard
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Page Views
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats?.total_page_views?.toLocaleString() || 0}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Unique Visitors
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats?.unique_visitors?.toLocaleString() || 0}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Avg. Daily Visitors
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {Math.round(
                (stats?.visitors_by_day?.reduce((acc, day) => acc + day.visitors, 0) || 0) /
                  (stats?.visitors_by_day?.length || 1)
              ).toLocaleString()}
            </dd>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Popular Pages
          </h3>
          <div className="space-y-4">
            {stats?.popular_pages?.map((page) => (
              <div
                key={page.path}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-600 truncate flex-1">
                  {page.path}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {page.view_count.toLocaleString()} views
                </span>
              </div>
            )) || <span>No popular pages available.</span>}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Referrers
          </h3>
          <div className="space-y-4">
            {stats?.referrer_stats?.map((referrer) => (
              <div
                key={referrer.referrer}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-600 truncate flex-1">
                  {referrer.referrer || 'Direct'}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {referrer.count.toLocaleString()} visits
                </span>
              </div>
            )) || <span>No referrer data available.</span>}
          </div>
        </div>
      </div>
    </div>
  );
} 