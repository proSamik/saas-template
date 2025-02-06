'use client'

export default function PrivacyPolicyPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-lg text-light-muted dark:text-dark-muted">
            <p>
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">1. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, including when you create an account, use our services, or contact us for support.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email, password)</li>
                <li>Usage data and analytics</li>
                <li>Payment information</li>
                <li>Communication records</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">2. How We Use Your Information</h2>
              <p>
                We use the collected information to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process your transactions</li>
                <li>Send you important updates</li>
                <li>Improve our services</li>
                <li>Respond to your requests</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">3. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">4. Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">5. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p>
                Email: privacy@saasplatform.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}