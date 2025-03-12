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
  const { userData, loading, error } = useUserData()
  const [mounted, setMounted] = useState(false)

  // Used to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Preventing access to developer tools
    const preventDevTools = () => {
      // Try to detect if dev tools are opening
      const devTools = window.open('', '_blank');
      if (devTools) {
        devTools.close();
      }
    };
    
    // Additional protection against inspect element
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    // Prevent keyboard shortcuts commonly used to open dev tools
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
      ) {
        e.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('blur', preventDevTools);
    window.addEventListener('contextmenu', preventRightClick);
    window.addEventListener('keydown', preventKeyboardShortcuts);
    
    return () => {
      window.removeEventListener('blur', preventDevTools);
      window.removeEventListener('contextmenu', preventRightClick);
      window.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, [])

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
      <div className="text-red-500">
        Error loading user data: {error}
      </div>
    )
  }

  const isSubscribed = hasActiveSubscription(userData)
  const planName = getPlanName(userData?.subscription?.variantId || null)
  const statusColor = getStatusColor(userData?.subscription?.status)

  // When the user doesn't have an active subscription, show pricing with mock background
  if (!isSubscribed) {
    return (
      <div className="relative min-h-screen">
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