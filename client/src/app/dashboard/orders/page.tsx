'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/axios'

interface Order {
  id: number
  order_id: number
  user_id: string
  user_email: string
  customer_id: number
  product_id: number
  variant_id: number
  status: string
  created_at: string
  updated_at: string
  refunded_at: string | null
}

export default function Orders() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (session?.user?.id && !session?.error) {
        try {
          const response = await api.get('/api/user/orders')
          setOrders(response.data?.orders || [])
        } catch (error) {
          console.error('Error fetching orders:', error)
          setOrders([])
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [session?.user?.id, session?.error])

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-light-muted dark:text-dark-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <Navigation />

      <div className="flex">
        <Sidebar />
        <div className="flex flex-1 flex-col md:pl-64">
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
                  Orders
                </h1>
              </div>

              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <div className="mt-8">
                  {orders.length > 0 ? (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-light-accent dark:divide-dark-accent">
                        <thead className="bg-light-background dark:bg-dark-background">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light-foreground dark:text-dark-foreground sm:pl-6">
                              Order ID
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-light-foreground dark:text-dark-foreground">
                              Status
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-light-foreground dark:text-dark-foreground">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-light-accent dark:divide-dark-accent bg-light-background dark:bg-dark-background">
                          {orders.map((order) => (
                            <tr key={order.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-light-foreground dark:text-dark-foreground sm:pl-6">
                                #{order.order_id}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-light-foreground dark:text-dark-foreground">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-light-foreground dark:text-dark-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent rounded-lg">
                      <p className="text-light-muted dark:text-dark-muted">No orders found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}