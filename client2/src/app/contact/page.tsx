'use client'

import { useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission logic
    console.log('Form submitted:', formData)
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground sm:text-6xl">
            Contact Us
          </h1>
          <p className="mt-6 text-lg leading-8 text-light-muted dark:text-dark-muted">
            Have questions? We're here to help. Send us a message and we'll respond as soon as possible.
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
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}