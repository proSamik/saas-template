'use client'

import Image from 'next/image'

export function Demo() {
  return (
    <div id="demo" className="overflow-hidden bg-light-background dark:bg-dark-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pr-8 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-base font-semibold leading-7 text-primary-600">Deploy faster</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">A better workflow</p>
              <p className="mt-6 text-lg leading-8 text-light-muted dark:text-dark-muted">
                Experience a streamlined development process with our modern tooling and infrastructure. Build, test, and deploy with confidence.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-light-muted dark:text-dark-muted lg:max-w-none">
                <div className="relative pl-9">
                  <dt className="inline font-semibold">
                    <svg className="absolute left-1 top-1 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
                    </svg>
                    Easy Deployment
                  </dt>
                  <dd className="inline"> Deploy your applications with a single command using our optimized build system.</dd>
                </div>
                <div className="relative pl-9">
                  <dt className="inline font-semibold">
                    <svg className="absolute left-1 top-1 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    Secure by Default
                  </dt>
                  <dd className="inline"> Built-in security features to protect your applications and data.</dd>
                </div>
                <div className="relative pl-9">
                  <dt className="inline font-semibold">
                    <svg className="absolute left-1 top-1 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
                    </svg>
                    Analytics
                  </dt>
                  <dd className="inline"> Detailed insights into your application's performance and usage.</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden dark:ring-white/5">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-primary-400 opacity-[0.03] dark:from-primary-400 dark:to-primary-600" />
              <div className="relative rounded-xl overflow-auto p-4">
                <pre className="text-sm leading-6">
                  <code className="text-light-foreground dark:text-dark-foreground">
                    {`# Deploy your application
                        $ saas deploy

                        ✓ Building application
                        ✓ Running tests
                        ✓ Optimizing assets
                        ✓ Deploying to production

                        Deployment complete! Your app is live at:
                        https://your-app.saas-platform.com`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}