'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Email verified successfully!');
        router.push('/profile');
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify email. The link may be expired or invalid.');
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          <div className="mt-4">
            {status === 'verifying' && (
              <div className="animate-pulse">
                <div className="text-lg text-gray-600">{message}</div>
              </div>
            )}
            {status === 'success' && (
              <div className="text-green-600">
                <div className="text-lg">{message}</div>
                <p className="mt-2 text-sm">Redirecting to your profile...</p>
              </div>
            )}
            {status === 'error' && (
              <div className="text-red-600">
                <div className="text-lg">{message}</div>
                <button
                  onClick={() => router.push('/profile')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 