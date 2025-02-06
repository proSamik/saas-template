'use client'

import React from 'react'
import { Footer } from '../components/Footer'
import { Features } from '../components/landing/Features'
import { Hero } from '../components/landing/Hero'

export default function Home() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <Hero />
      <Features />
      <Footer />
    </div>
  )
}