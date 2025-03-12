'use client'

import { useUserData } from '@/contexts/UserDataContext'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PriceCard } from '@/components/landing/PriceCard'
import { useState, useEffect } from 'react'
import { PRICING_PLANS, getPlanName, getStatusColor, hasActiveSubscription } from '@/lib/pricing'

/**
 * MockBackground component that creates a visual placeholder instead of using the actual content.
 * This prevents users from accessing real data through inspect element.
 */
const MockBackground = () => {
  return (
    <div className="opacity-50">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-light-foreground dark:text-dark-foreground">
          Overview
        </h1>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-light-foreground dark:text-dark-foreground">
                Subscription Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-light-muted dark:text-dark-muted mb-1">Current Plan</p>
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div>
                  <p className="text-sm text-light-muted dark:text-dark-muted mb-1">Status</p>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function UserOverview() {
  const { userData, loading, error, forceRefreshUserData } = useUserData()
  const [mounted, setMounted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [manualRefreshCount, setManualRefreshCount] = useState(0)

  // Used to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Automatically force refresh on first load to ensure fresh data
  // But only do this once - the useRef in UserDataContext will prevent excessive refreshes
  useEffect(() => {
    if (mounted && manualRefreshCount === 0) {
      const autoRefresh = async () => {
        console.log('Auto-refreshing data on page load');
        setRefreshing(true);
        await forceRefreshUserData();
        setRefreshing(false);
        setManualRefreshCount(prev => prev + 1);
      };
      
      autoRefresh();
    }
  }, [mounted, forceRefreshUserData, manualRefreshCount]);

  const handleRefresh = async () => {
    setRefreshing(true)
    setManualRefreshCount(prev => prev + 1);
    await forceRefreshUserData()
    setRefreshing(false)
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-red-500 mb-4">
          Error loading user data: {error}
        </div>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          You may need to log out and log back in if the issue persists.
        </div>
      </div>
    )
  }

  // Debug userData object
  console.log('UserData in overview:', userData);
  
  // Check for the 'none' status that represents no subscription
  if (userData?.subscription?.status === 'none') {
    console.log('User has no subscription (none status)');
    return (
      <div className="relative min-h-screen">
        {/* Debug info and refresh button at the top */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded mb-2"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          {userData && (
            <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 max-w-md">
              <p>Debug: {JSON.stringify({
                status: userData.subscription.status,
                productId: userData.subscription.productId,
                variantId: userData.subscription.variantId
              })}</p>
            </div>
          )}
        </div>
        
        {/* Mock background instead of actual blurred content */}
        <MockBackground />

        {/* Pricing overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="bg-light-background dark:bg-dark-background p-6 rounded-xl shadow-xl max-w-4xl w-full">
            <h2 className="text-2xl font-bold text-center mb-2 text-light-foreground dark:text-dark-foreground">
              Subscribe to Unlock Features
            </h2>
            <p className="text-center mb-8 text-light-muted dark:text-dark-muted">
              Choose a plan that's right for you to access all features and analytics.
            </p>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 justify-items-center">
              {PRICING_PLANS.map((plan) => (
                <PriceCard
                  key={plan.variantId}
                  name={plan.name}
                  description={plan.description}
                  price={plan.price}
                  features={plan.features}
                  popular={plan.popular}
                  productId={plan.productId}
                  variantId={plan.variantId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Create a safe version of userData for hasActiveSubscription function
  // that matches the expected type { subscription?: { status?: string; variantId?: string | number } }
  const subscriptionData = userData ? {
    subscription: {
      status: userData.subscription.status || undefined,
      variantId: userData.subscription.variantId || undefined
    }
  } : { subscription: undefined };
  
  console.log('Subscription data passed to hasActiveSubscription:', subscriptionData);
  
  const isSubscribed = userData ? hasActiveSubscription(subscriptionData) : false;
  console.log('Is user subscribed?', isSubscribed);
  
  const planName = getPlanName(userData?.subscription?.variantId || null)
  const statusColor = getStatusColor(userData?.subscription?.status)

  // Force override for active subscriptions if server data indicates an active subscription
  // but our logic is not detecting it correctly
  if (userData?.subscription?.status?.toLowerCase() === 'active' && !isSubscribed) {
    console.log('Subscription status is active but isSubscribed is false. Forcing subscription recognition.');
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-light-foreground dark:text-dark-foreground">
            Overview
          </h1>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-light-foreground dark:text-dark-foreground">
                Subscription Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-light-muted dark:text-dark-muted mb-1">Current Plan</p>
                  <p className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
                    {planName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-light-muted dark:text-dark-muted mb-1">Status</p>
                  <p className={`text-lg font-medium ${statusColor}`}>
                    {userData?.subscription.status || 'No active subscription'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // When the user doesn't have an active subscription, show pricing with mock background
  if (!isSubscribed) {
    return (
      <div className="relative min-h-screen">
        {/* Debug info and refresh button at the top */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded mb-2"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          {userData && (
            <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 max-w-md">
              <p>Debug: {JSON.stringify({
                status: userData.subscription.status,
                productId: userData.subscription.productId,
                variantId: userData.subscription.variantId
              })}</p>
            </div>
          )}
        </div>
        
        {/* Mock background instead of actual blurred content */}
        <MockBackground />

        {/* Pricing overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="bg-light-background dark:bg-dark-background p-6 rounded-xl shadow-xl max-w-4xl w-full">
            <h2 className="text-2xl font-bold text-center mb-2 text-light-foreground dark:text-dark-foreground">
              Subscribe to Unlock Features
            </h2>
            <p className="text-center mb-8 text-light-muted dark:text-dark-muted">
              Choose a plan that's right for you to access all features and analytics.
            </p>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 justify-items-center">
              {PRICING_PLANS.map((plan) => (
                <PriceCard
                  key={plan.variantId}
                  name={plan.name}
                  description={plan.description}
                  price={plan.price}
                  features={plan.features}
                  popular={plan.popular}
                  productId={plan.productId}
                  variantId={plan.variantId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal overview for subscribed users
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-light-foreground dark:text-dark-foreground">
          Overview
        </h1>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-light-foreground dark:text-dark-foreground">
              Subscription Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-light-muted dark:text-dark-muted mb-1">Current Plan</p>
                <p className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
                  {planName}
                </p>
              </div>
              <div>
                <p className="text-sm text-light-muted dark:text-dark-muted mb-1">Status</p>
                <p className={`text-lg font-medium ${statusColor}`}>
                  {userData?.subscription.status || 'No active subscription'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 