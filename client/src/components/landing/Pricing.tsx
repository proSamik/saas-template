'use client'

import { pricingPlans } from '@/data/landing'

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
          <div key={plan.name} className="flex flex-col justify-between rounded-3xl bg-light-background dark:bg-dark-background p-8 ring-1 ring-light-accent dark:ring-dark-accent xl:p-10">
            <div>
              <div className="flex items-center justify-between gap-x-4">
                <h3 className="text-lg font-semibold leading-8">{plan.name}</h3>
                {plan.popular && (
                  <p className="rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary-600">
                    Most popular
                  </p>
                )}
              </div>
              <p className="mt-6 text-sm leading-6 text-light-muted dark:text-dark-muted">{plan.description}</p>
              <p className="mt-8 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-sm font-semibold leading-6 text-light-muted dark:text-dark-muted">/month</span>
              </p>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-light-muted dark:text-dark-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <a href="#" className="mt-8 block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
              Get started
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}