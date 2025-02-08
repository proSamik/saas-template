'use client';

import { PriceCard } from './PriceCard';

const pricingPlans = [
  {
    name: 'Basic',
    description: 'Perfect for small projects and individual developers.',
    price: 9,
    features: [
      'Up to 5 projects',
      'Basic analytics',
      'Community support',
      'Basic integrations'
    ],
    productId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID || '',
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_1 || ''
  },
  {
    name: 'Pro',
    description: 'Ideal for growing teams and businesses.',
    price: 29,
    features: [
      'Up to 15 projects',
      'Advanced analytics',
      'Priority support',
      'Advanced integrations',
      'Custom domains'
    ],
    popular: true,
    productId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID || '',
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_2 || ''
  },
  {
    name: 'Enterprise',
    description: 'For large-scale applications and organizations.',
    price: 99,
    features: [
      'Unlimited projects',
      'Enterprise analytics',
      'Dedicated support',
      'Custom integrations',
      'Multiple domains',
      'SLA guarantee'
    ],
    productId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID || '',
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_3 || ''
  }
];

export function Pricing() {

  return (
    <div id="pricing" className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl lg:text-center">
        <h2 className="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </p>
        <p className="mt-6 text-lg leading-8 text-light-muted dark:text-dark-muted">
          Choose the plan that best fits your needs. All plans include our core features.
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 md:max-w-none md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <PriceCard
            key={plan.name}
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
  );
}