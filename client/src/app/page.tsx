'use client'

import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/landing/Hero'
import { Demo } from '@/components/landing/Demo'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { Testimonials } from '@/components/landing/Testimonials'
import { CTA } from '@/components/landing/CTA'

/**
 * Landing page component that displays the main marketing page
 * with hero section and key features
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <Navigation />
      <Hero />
      <Demo />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}