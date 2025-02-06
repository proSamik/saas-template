'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Product } from '@/types/api'

export default function Products() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (!session) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background">
        <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="text-center text-light-foreground dark:text-dark-foreground">
            Please log in to view products
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background">
        <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="text-center text-light-foreground dark:text-dark-foreground">
            Loading products...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-light-foreground dark:text-dark-foreground">
          Products
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-light-foreground dark:text-dark-foreground">
                {product.name}
              </h2>
              <p className="mt-2 text-light-muted dark:text-dark-muted">
                {product.description}
              </p>
              <p className="mt-4 text-lg font-medium text-light-foreground dark:text-dark-foreground">
                ${product.price}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}