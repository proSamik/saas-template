'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function GoogleCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      router.push('/auth?error=' + error)
      return
    }

    router.push('/')
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="text-center text-light-foreground dark:text-dark-foreground">
          Redirecting...
        </div>
      </div>
    </div>
  )
}