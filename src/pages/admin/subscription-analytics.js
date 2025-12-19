import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SubscriptionAnalytics = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [periodDays, setPeriodDays] = useState(30);

  // Fetch subscription analytics data
  const { data, isLoading, error } = useQuery(
    ['subscriptionAnalytics', periodDays],
    async () => {
      const { data } = await axios.get('/api/analytics/subscriptions', {
        params: { periodDays }
      });
      return data;
    },
    {
      enabled: !!isAuthenticated && isAdmin,
      refetchInterval: 300000, // Refetch every 5 minutes
      staleTime: 60000, // Consider data stale after 1 minute
    }
  );

  // Fetch subscription metrics
  const { data: metricsData, isLoading: isLoadingMetrics } = useQuery(
    ['subscriptionMetrics'],
    async () => {
      const { data } = await axios.get('/api/analytics/subscriptions/metrics');
      return data;
    },
    {
      enabled: !!isAuthenticated && isAdmin,
      refetchInterval: 300000, // Refetch every 5 minutes
      staleTime: 60000, // Consider data stale after 1 minute
    }
  );

  // Handle period change
  const handlePeriodChange = (days) => {
    setPeriodDays(days);
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p>You must be an admin to view this page.</p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading || isLoadingMetrics) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Subscription Analytics</h1>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Subscription Analytics</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error loading analytics data. Please try again later.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Prepare data for subscription growth chart
  const subscriptionGrowthData = {
    labels: data?.subscriptionGrowth?.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'New Subscriptions',
        data: data?.subscriptionGrowth?.map(item => item.count) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Prepare data for subscription status chart
  const subscriptionStatusData = {
    labels: ['Active', 'Trialing', 'Past Due', 'Canceled', 'Incomplete'],
    datasets: [
      {
        label: 'Subscriptions by Status',
        data: [
          data?.subscriptionsByStatus?.active || 0,
          data?.subscriptionsByStatus?.trialing || 0,
          data?.subscriptionsByStatus?.past_due || 0,
          data?.subscriptionsByStatus?.canceled || 0,
          (data?.subscriptionsByStatus?.incomplete || 0) + (data?.subscriptionsByStatus?.incomplete_expired || 0),
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',  // green for active
          'rgba(59, 130, 246, 0.6)',  // blue for trialing
          'rgba(245, 158, 11, 0.6)',  // amber for past_due
          'rgba(239, 68, 68, 0.6)',   // red for canceled
          'rgba(156, 163, 175, 0.6)', // gray for incomplete
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Subscription Analytics</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePeriodChange(7)}
              className={`px-3 py-1 rounded ${periodDays === 7 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => handlePeriodChange(30)}
              className={`px-3 py-1 rounded ${periodDays === 30 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => handlePeriodChange(90)}
              className={`px-3 py-1 rounded ${periodDays === 90 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
            >
              90 Days
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Active Subscriptions</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{metricsData?.activeSubscriptions || 0}</span>
              <span className="ml-2 text-sm text-gray-500">subscribers</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Trial Subscriptions</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{metricsData?.trialSubscriptions || 0}</span>
              <span className="ml-2 text-sm text-gray-500">trials</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Monthly Recurring Revenue</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">${metricsData?.mrr || 0}</span>
              <span className="ml-2 text-sm text-gray-500">per month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Conversion Rate</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{data?.conversionRate?.conversionRate || 0}%</span>
              <span className="ml-2 text-sm text-gray-500">of users</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-700 font-medium mb-4">Subscription Growth</h3>
            <div className="h-64">
              <Line
                data={subscriptionGrowthData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-700 font-medium mb-4">Subscriptions by Status</h3>
            <div className="h-64">
              <Pie
                data={subscriptionStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>
        </div>

        {/* Retention Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-gray-700 font-medium mb-4">Retention Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Subscriptions</p>
              <p className="text-2xl font-bold">{data?.retentionRate?.totalSubscriptions || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Retained Subscriptions</p>
              <p className="text-2xl font-bold">{data?.retentionRate?.retainedSubscriptions || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Retention Rate</p>
              <p className="text-2xl font-bold">{data?.retentionRate?.retentionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SubscriptionAnalytics;
