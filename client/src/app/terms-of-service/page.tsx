'use client'

import { Footer } from '@/components/Footer'

/**
 * Terms of Service page component
 */
export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="prose prose-lg mx-auto dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="lead">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using SaaS Platform, you agree to be bound by these Terms of Service
            and all applicable laws and regulations.
          </p>

          <h2>2. Use License</h2>
          <p>
            Subject to your compliance with these Terms of Service, we grant you a limited,
            non-exclusive, non-transferable, revocable license to use our service.
          </p>

          <h2>3. Account Terms</h2>
          <p>
            You are responsible for:
          </p>
          <ul>
            <li>Maintaining the security of your account</li>
            <li>All activities that occur under your account</li>
            <li>Ensuring your account information is accurate</li>
            <li>Notifying us of any unauthorized use</li>
          </ul>

          {/* Add more sections as needed */}
        </div>
      </div>

      <Footer />
    </div>
  )
}