'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'Access was denied. Please try signing in again.';
      case 'Verification':
        return 'The verification link is invalid or has expired.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'OAuthCallback':
        return 'There was a problem with the OAuth callback.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{getErrorMessage(error)}</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
} 