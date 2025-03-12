import { PriceCard } from '@/components/landing/PriceCard'
import { PRICING_PLANS } from '@/lib/pricing'
import { MockBackground } from './MockBackground'

/**
 * Component for displaying pricing options for non-subscribers or free users
 */
export interface PricingViewProps {
  userData?: {
    subscription: {
      status: string | null
      productId: number | null
      variantId: number | null
    }
  }
}

export const PricingView = ({ userData }: PricingViewProps) => {
  return (
    <div className="relative min-h-screen">
      {/* Debug info at the top - only shown in development */}
      {process.env.NODE_ENV === 'development' && userData && (
        <div className="absolute top-4 right-4 z-20">
          <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 max-w-md">
            <p>Debug: {JSON.stringify({
              status: userData.subscription.status,
              productId: userData.subscription.productId,
              variantId: userData.subscription.variantId
            })}</p>
          </div>
        </div>
      )}
      
      {/* Mock background */}
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