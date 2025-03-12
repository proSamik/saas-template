'use client'

import { useState } from 'react'
import { Footer } from '@/components/Footer'
import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/seo/JsonLd'

/**
 * SEO metadata for the Contact page
 */
export const metadata: Metadata = createMetadata({
  title: 'Contact Us',
  description: 'Get in touch with our team for support, inquiries, or partnership opportunities. We\'re here to help with all your software development needs.',
  keywords: ['contact', 'support', 'help', 'customer service', 'inquiry'],
  type: 'website',
})

/**
 * Contact page component with contact form and company information
 */
export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  })

  // Contact page structured data
  const contactPageData = {
    '@type': 'ContactPage',
    name: 'Contact Us',
    description: 'Get in touch with our team',
    mainEntity: {
      '@type': 'Organization',
      name: 'Your Company Name',
      telephone: '+1-800-123-4567',
      email: 'contact@example.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Tech Street',
        addressLocality: 'San Francisco',
        addressRegion: 'CA',
        postalCode: '94105',
        addressCountry: 'US'
      },
      openingHours: 'Mo-Fr 09:00-18:00'
    }
  }

  /**
   * Handles the form submission event.
   * Prevents the default form submission behavior,
   * logs the form data to the console, and can be extended
   * to include actual form submission logic.
   * 
   * @param e - The form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission logic
    console.log('Form submitted:', formData)
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      {/* Add structured data for contact page */}
      <JsonLd data={contactPageData} />

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground sm:text-6xl">
            Contact Us
          </h1>
          <p className="mt-6 text-lg leading-8 text-light-muted dark:text-dark-muted">
            Have questions? We&apos;re here to help. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 block w-full rounded-md border border-light-accent dark:border-dark-accent bg-light-background dark:bg-dark-background px-3 py-2 text-light-foreground dark:text-dark-foreground shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2 block w-full rounded-md border border-light-accent dark:border-dark-accent bg-light-background dark:bg-dark-background px-3 py-2 text-light-foreground dark:text-dark-foreground shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-2 block w-full rounded-md border border-light-accent dark:border-dark-accent bg-light-background dark:bg-dark-background px-3 py-2 text-light-foreground dark:text-dark-foreground shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm"
              >
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Sales</option>
                <option>Partnership</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="mt-2 block w-full rounded-md border border-light-accent dark:border-dark-accent bg-light-background dark:bg-dark-background px-3 py-2 text-light-foreground dark:text-dark-foreground shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                className="rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Send message
              </button>
            </div>
          </form>

          <div className="mt-16 border-t border-light-accent dark:border-dark-accent pt-8">
            <h2 className="text-2xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
              Other Ways to Reach Us
            </h2>
            <dl className="mt-6 space-y-6">
              <div>
                <dt className="text-base font-semibold text-light-foreground dark:text-dark-foreground">Office Location</dt>
                <dd className="mt-2 text-base text-light-muted dark:text-dark-muted">
                  123 Tech Street<br />
                  San Francisco, CA 94105<br />
                  United States
                </dd>
              </div>
              <div>
                <dt className="text-base font-semibold text-light-foreground dark:text-dark-foreground">Support Hours</dt>
                <dd className="mt-2 text-base text-light-muted dark:text-dark-muted">
                  Monday - Friday<br />
                  9:00 AM - 6:00 PM PST
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}