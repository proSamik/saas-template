'use client'

export function Demo() {
  return (
    <div id="demo" className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl lg:text-center">
        <h2 className="text-base font-semibold leading-7 text-primary-600">See it in action</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Experience the power of our platform
        </p>
        <p className="mt-6 text-lg leading-8 text-light-muted dark:text-dark-muted">
          Watch our demo to see how our platform can transform your business operations and drive growth.
        </p>
        <div className="mt-10 flex justify-center">
          <div className="relative rounded-2xl bg-light-accent dark:bg-dark-accent p-2 w-full max-w-3xl aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-light-muted dark:text-dark-muted">Demo Video Placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}