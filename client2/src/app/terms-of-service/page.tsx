'use client'

export default function TermsOfServicePage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-lg text-light-muted dark:text-dark-muted">
            <p>
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing and using our platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">2. Use License</h2>
              <p>
                We grant you a limited, non-exclusive, non-transferable license to use our platform for your business purposes in accordance with these terms.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must not modify or copy our platform's code</li>
                <li>You must not use the platform for illegal purposes</li>
                <li>You must not attempt to gain unauthorized access</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">3. Account Terms</h2>
              <p>
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the security of your account</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring your account information is accurate</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">4. Payment Terms</h2>
              <p>
                Subscription fees are billed in advance on a monthly basis. All fees are non-refundable unless otherwise stated.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">5. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account and access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">6. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">7. Contact</h2>
              <p>
                For any questions about these Terms of Service, please contact us at:
              </p>
              <p>
                Email: legal@saasplatform.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}