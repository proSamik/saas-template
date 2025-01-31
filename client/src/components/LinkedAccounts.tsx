'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import axios from '@/lib/axios'
import Button from './Button'

interface LinkedAccount {
  id: string
  provider: string
  email: string
}

export default function LinkedAccounts() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<LinkedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLinkedAccounts()
  }, [])

  const fetchLinkedAccounts = async () => {
    try {
      const response = await axios.get('/auth/linked-accounts')
      setAccounts(response.data.accounts)
      setError('')
    } catch (err: any) {
      setError('Failed to load linked accounts')
      console.error('Error loading linked accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async (provider: string) => {
    try {
      await signIn(provider, {
        redirect: false,
        callbackUrl: window.location.href,
        trigger: 'link'
      })
    } catch (err: any) {
      setError('Failed to link account')
      console.error('Error linking account:', err)
    }
  }

  const handleUnlink = async (id: string) => {
    try {
      await axios.delete(`/auth/link/${id}`)
      await fetchLinkedAccounts()
      setError('')
    } catch (err: any) {
      setError('Failed to unlink account')
      console.error('Error unlinking account:', err)
    }
  }

  if (loading) {
    return <div className="text-center">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Linked Accounts</h2>
      
      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="font-medium">Email/Password</h3>
            <p className="text-sm text-gray-500">{session?.user?.email}</p>
          </div>
          <div className="text-sm text-gray-500">Primary Account</div>
        </div>

        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div>
              <h3 className="font-medium capitalize">{account.provider}</h3>
              <p className="text-sm text-gray-500">{account.email}</p>
            </div>
            <Button
              variant="danger"
              onClick={() => handleUnlink(account.id)}
            >
              Unlink
            </Button>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <h3 className="text-lg font-medium mb-4">Add New Account</h3>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => handleLink('google')}
          >
            Link Google Account
          </Button>
        </div>
      </div>
    </div>
  )
} 