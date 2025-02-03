'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/lib/store';
import api from '@/lib/axios';

interface Subscription {
  id: string;
  attributes: {
    status: string;
    renews_at: string;
    ends_at: string | null;
    created_at: string;
    trial_ends_at: string | null;
  };
  relationships: {
    product: {
      data: {
        attributes: {
          name: string;
          price_formatted: string;
        };
      };
    };
  };
}

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/subscriptions');
        setSubscriptions(response.data.data);
      } catch (error: any) {
        console.error('Error fetching subscriptions:', error);
        setError(error?.response?.data?.message || 'Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in to access this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading subscriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <p className="text-gray-500">No active subscriptions found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <h3 className="text-xl font-semibold mb-2">
                {subscription.relationships.product.data.attributes.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {subscription.relationships.product.data.attributes.price_formatted}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`capitalize text-sm ${subscription.attributes.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {subscription.attributes.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Renews on</span>
                  <span className="text-sm">
                    {new Date(subscription.attributes.renews_at).toLocaleDateString()}
                  </span>
                </div>
                {subscription.attributes.trial_ends_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Trial ends on</span>
                    <span className="text-sm">
                      {new Date(subscription.attributes.trial_ends_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <button
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  onClick={() => {}}
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}