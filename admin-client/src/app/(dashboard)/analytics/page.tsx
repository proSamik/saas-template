'use client';

import { useEffect, useState } from 'react';
import { getUserJourney, getVisitorJourney, type PageView } from '@/lib/services/analytics';
import Loading from '@/components/ui/loading';
import Error from '@/components/ui/error';
import { formatDate } from '@/lib/utils/format';

export default function AnalyticsPage() {
  const [journeyData, setJourneyData] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchType, setSearchType] = useState<'user' | 'visitor'>('user');
  const [searchId, setSearchId] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    end: new Date().toISOString().split('T')[0], // today
  });

  const fetchJourney = async () => {
    if (!searchId) {
      setError('Please enter an ID to search');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const startTime = new Date(dateRange.start).toISOString();
      const endTime = new Date(dateRange.end).toISOString();

      const data = searchType === 'user'
        ? await getUserJourney(searchId, startTime, endTime)
        : await getVisitorJourney(searchId, startTime, endTime);

      setJourneyData(data);
    } catch (err) {
      setError(`Failed to fetch ${searchType} journey`);
      console.error('Error fetching journey:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">User Analytics</h1>
        <p className="mt-2 text-sm text-gray-700">
          View detailed journey of users and visitors.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Search Type</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'user' | 'visitor')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="user">User ID</option>
                <option value="visitor">Visitor ID</option>
              </select>
            </div>

            {/* ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {searchType === 'user' ? 'User ID' : 'Visitor ID'}
              </label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={`Enter ${searchType} ID`}
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={fetchJourney}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>

          {error && (
            <div className="mt-4">
              <Error message={error} retry={fetchJourney} />
            </div>
          )}
        </div>
      </div>

      {/* Journey Timeline */}
      {journeyData.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Journey Timeline</h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {journeyData.map((event, index) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {index < journeyData.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Visited <span className="font-medium text-gray-900">{event.path}</span>
                            </p>
                            {event.referrer && (
                              <p className="text-sm text-gray-500">
                                From: <span className="text-gray-700">{event.referrer}</span>
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime={event.created_at}>{formatDate(event.created_at)}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 