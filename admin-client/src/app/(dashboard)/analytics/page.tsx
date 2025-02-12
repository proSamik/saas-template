'use client';

import { useEffect, useState } from 'react';
import { getAnalyticsStats } from '@/lib/services/analytics';
import type { AnalyticsStats } from '@/lib/services/analytics';
import Loading from '@/components/ui/loading';
import Error from '@/components/ui/error';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface DayVisitor {
  date: string;
  visitors: number;
}

interface ChartDataItem {
  name?: string;
  value?: number;
  date?: string;
  visitors?: number;
  growth?: number;
  views?: number;
  percentage?: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState('30'); // days
  const [chartView, setChartView] = useState<
    'visitors' | 'pages' | 'referrers' | 'trends' | 'comparison'
  >('visitors');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000
      ).toISOString();
      const data = await getAnalyticsStats(startDate, endDate);
      setStats(data);
    } catch (err) {
      setError('Failed to fetch analytics stats');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!stats) return;

    // Prepare data for each section
    const pageViews = stats.popular_pages.map((page) => ({
      type: 'Page View',
      path: page.path,
      count: page.view_count,
      date: '',
    }));

    const referrers = stats.referrer_stats.map((ref) => ({
      type: 'Referrer',
      path: ref.referrer,
      count: ref.count,
      date: '',
    }));

    const dailyVisitors = stats.visitors_by_day.map((day) => ({
      type: 'Daily Visitors',
      path: '',
      count: day.visitors,
      date: day.date,
    }));

    // Combine all data
    const data = [...pageViews, ...referrers, ...dailyVisitors];

    // Convert to CSV
    const headers = ['Type', 'Path/Referrer', 'Count', 'Date'];
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        [row.type, row.path, row.count, row.date].map((cell) => `"${cell}"`).join(',')
      ),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `analytics_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChartData = (): ChartDataItem[] => {
    if (!stats) return [];

    switch (chartView) {
      case 'visitors':
        return stats.visitors_by_day.map(day => ({
          date: new Date(day.date).toLocaleDateString(),
          visitors: day.visitors,
          trend: calculateMovingAverage(stats.visitors_by_day, day.date)
        }));
      case 'pages':
        return stats.popular_pages.map(page => ({
          name: page.path,
          value: page.view_count
        }));
      case 'referrers':
        return stats.referrer_stats.map(ref => ({
          name: ref.referrer || 'Direct',
          value: ref.count
        }));
      case 'trends':
        return calculateDailyGrowth(stats.visitors_by_day);
      case 'comparison':
        return calculateComparison(stats);
      default:
        return [];
    }
  };

  const calculateMovingAverage = (data: DayVisitor[] | undefined, currentDate: string): number => {
    if (!data) return 0;
    const windowSize = 7;
    const currentIndex = data.findIndex((d: DayVisitor) => d.date === currentDate);
    const startIndex = Math.max(0, currentIndex - windowSize + 1);
    const window = data.slice(startIndex, currentIndex + 1);
    return Math.round(window.reduce((sum: number, day: DayVisitor) => sum + day.visitors, 0) / window.length);
  };

  const calculateDailyGrowth = (data: DayVisitor[] | undefined) => {
    if (!data) return [];
    return data.map((day: DayVisitor, index: number) => {
      const prevDay = index > 0 ? data[index - 1].visitors : day.visitors;
      const growth = ((day.visitors - prevDay) / prevDay) * 100;
      return {
        date: new Date(day.date).toLocaleDateString(),
        visitors: day.visitors,
        growth: Number.isFinite(growth) ? growth : 0
      };
    });
  };

  const calculateComparison = (data: NonNullable<typeof stats>) => {
    const totalViews = data.total_page_views;
    return data.popular_pages.map(page => ({
      name: page.path,
      views: page.view_count,
      percentage: (page.view_count / totalViews) * 100
    }));
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} retry={fetchStats} />;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Detailed analytics and statistics.
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Page Views
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.total_page_views?.toLocaleString() || 0}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Unique Visitors
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.unique_visitors?.toLocaleString() || 0}
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
                (stats.visitors_by_day?.reduce((acc, day) => acc + day.visitors, 0) || 0) /
                  (stats.visitors_by_day?.length || 1)
              ).toLocaleString()}
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Analytics Overview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setChartView('visitors')}
              className={`px-3 py-1 rounded-md text-sm ${
                chartView === 'visitors'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Visitors
            </button>
            <button
              onClick={() => setChartView('pages')}
              className={`px-3 py-1 rounded-md text-sm ${
                chartView === 'pages'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setChartView('referrers')}
              className={`px-3 py-1 rounded-md text-sm ${
                chartView === 'referrers'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Referrers
            </button>
            <button
              onClick={() => setChartView('trends')}
              className={`px-3 py-1 rounded-md text-sm ${
                chartView === 'trends'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setChartView('comparison')}
              className={`px-3 py-1 rounded-md text-sm ${
                chartView === 'comparison'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Comparison
            </button>
          </div>
        </div>

        <div className="h-[400px]">
          {chartView === 'visitors' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  fill="#8884d8"
                  stroke="#8884d8"
                  fillOpacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                  name="7-day Average"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {chartView === 'pages' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getChartData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={(entry) => entry.name}
                >
                  {getChartData().map((entry: ChartDataItem, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}

          {chartView === 'referrers' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartView === 'trends' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="visitors"
                  fill="#8884d8"
                  yAxisId="left"
                  name="Visitors"
                />
                <Line
                  type="monotone"
                  dataKey="growth"
                  stroke="#82ca9d"
                  yAxisId="right"
                  name="Growth %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {chartView === 'comparison' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="views"
                  fill="#8884d8"
                  yAxisId="left"
                  name="Views"
                />
                <Bar
                  dataKey="percentage"
                  fill="#82ca9d"
                  yAxisId="right"
                  name="% of Total"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Popular Pages
          </h3>
          <div className="space-y-4">
            {stats.popular_pages?.map((page) => (
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
            {stats.referrer_stats?.map((referrer) => (
              <div
                key={referrer.referrer}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-600 truncate flex-1">
                  {referrer.referrer}
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