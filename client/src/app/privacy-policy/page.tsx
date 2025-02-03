'use client'

import { Footer } from '@/components/Footer'

/**
 * Privacy Policy page component
 */
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="prose prose-lg mx-auto dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="lead">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to SaaS Platform. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our service.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us when you:
          </p>
          <ul>
            <li>Create an account</li>
            <li>Use our services</li>
            <li>Contact us for support</li>
            <li>Subscribe to our newsletters</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide and maintain our service</li>
            <li>Notify you about changes to our service</li>
            <li>Provide customer support</li>
            <li>Monitor the usage of our service</li>
          </ul>

          {/* Add more sections as needed */}
        </div>
      </div>

      <Footer />
    </div>
  )
}