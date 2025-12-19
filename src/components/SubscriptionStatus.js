import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * Subscription status indicator component
 * Shows the current subscription status and expiration date
 */
const SubscriptionStatus = () => {
  const { user, isAuthenticated } = useAuth();

  // Fetch current subscription status
  const { data, isLoading, error } = useQuery(
    ['subscription'],
    async () => {
      const { data } = await axios.get('/api/subscriptions/current');
      return data;
    },
    {
      enabled: !!isAuthenticated,
      refetchInterval: 60000, // Refetch every minute to keep status updated
      staleTime: 30000, // Consider data stale after 30 seconds
    }
  );

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  // No subscription found
  if (!data.subscription) {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        No Subscription
      </div>
    );
  }

  // Format expiration date
  const expiresAt = new Date(data.subscription.currentPeriodEnd);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(expiresAt);

  // Status colors
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    trialing: 'bg-blue-100 text-blue-800',
    past_due: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-red-100 text-red-800',
    incomplete: 'bg-yellow-100 text-yellow-800',
    incomplete_expired: 'bg-red-100 text-red-800'
  };

  // Status labels
  const statusLabels = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired'
  };

  const colorClass = statusColors[data.subscription.status] || 'bg-gray-100 text-gray-800';
  const statusLabel = statusLabels[data.subscription.status] || data.subscription.status;

  return (
    <div className="flex flex-col">
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {statusLabel}
      </div>
      {(data.subscription.status === 'active' || data.subscription.status === 'trialing') && (
        <div className="text-xs text-gray-500 mt-1">
          {data.subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'} {formattedDate}
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
