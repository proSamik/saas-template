'use client'

import { CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small projects and individual developers.',
    price: 29,
    popular: false,
    features: [
      'Up to 5 team members',
      '5GB of storage',
      'Basic support',
      'Basic analytics',
    ],
  },
  {
    name: 'Pro',
    description: 'Best for growing teams and businesses.',
    price: 99,
    popular: true,
    features: [
      'Up to 20 team members',
      '20GB of storage',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with specific needs.',
    price: 299,
    popular: false,
    features: [
      'Unlimited team members',
      'Unlimited storage',
      '24/7 dedicated support',
      'Advanced analytics',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
]

export function Pricing() {
  return (
    <div id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Choose the right plan for you</p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-light-muted dark:text-dark-muted">
          Choose from our competitive pricing plans that scale with your needs. All plans include core features.
        </p>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan, planIdx) => (
            <div
              key={plan.name}
              className={`flex flex-col justify-between rounded-3xl bg-light-background dark:bg-dark-background p-8 ring-1 ring-light-accent dark:ring-dark-accent xl:p-10 ${plan.popular ? 'relative lg:z-10 lg:rounded-b-none' : 'lg:mt-8'}`}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8">{plan.name}</h3>
                  {plan.popular ? (
                    <p className="rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary-600">
                      Most popular
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-light-muted dark:text-dark-muted">{plan.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight">${plan.price}</span>
                  <span className="text-sm font-semibold leading-6 text-light-muted dark:text-dark-muted">/month</span>
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-light-muted dark:text-dark-muted">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant={plan.popular ? 'default' : 'outline'}
                className="mt-8 w-full"
                asChild
              >
                <Link href="/auth/signup">
                  Get started
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}