'use client'

import { useUserData } from '@/contexts/UserDataContext'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Define variant IDs from environment variables
const VARIANT_IDS = {
  BASIC: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_1 || '',
  PRO: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_2 || '',
  ENTERPRISE: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_3 || '',
}

const getPlanName = (variantId: string | number | null) => {
  if (!variantId) return 'No Plan'
  
  const variantStr = variantId.toString()
  switch (variantStr) {
    case VARIANT_IDS.BASIC:
      return 'Basic Plan'
    case VARIANT_IDS.PRO:
      return 'Pro Plan'
    case VARIANT_IDS.ENTERPRISE:
      return 'Enterprise Plan'
    default:
      return 'Unknown Plan'
  }
}

const getStatusColor = (status: string | null | undefined) => {
  if (!status) return 'text-gray-500'
  
  switch (status.toLowerCase()) {
    case 'active':
      return 'text-green-500'
    case 'cancelled':
      return 'text-yellow-500'
    case 'expired':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

export default function UserOverview() {
  const { userData, loading, error } = useUserData()

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

  const planName = getPlanName(userData?.subscription.variantId || null)
  const statusColor = getStatusColor(userData?.subscription.status)

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