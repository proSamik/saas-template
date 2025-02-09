'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Overview from '@/components/dashboard/Overview';
import Reports from '@/components/dashboard/Reports';
import Analytics from '@/components/dashboard/Analytics';
import Settings from '@/components/dashboard/Settings';

// Define variant IDs from environment variables
const VARIANT_IDS = {
  BASIC: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_1,
  PRO: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_2,
  ENTERPRISE: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_3,
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const response = await authService.verifyUser();
        
        // If user doesn't have an active subscription, redirect to pricing
        if (response === null ||  (!response.status || response.status !== 'active')) {
          console.log('User does not have an active subscription');
          router.push('/#pricing');
          return;
        }

        setVariantId(response.variant_id?.toString());
        setIsLoading(false);
      } catch (err) {
        console.error('Error verifying user access:', err);
        setError('Error verifying access. Please try again later.');
        setIsLoading(false);
      }
    };

    verifyAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Determine available features based on variant ID
  const features = {
    overview: true, // Available for all plans
    analytics: variantId === VARIANT_IDS.PRO || variantId === VARIANT_IDS.ENTERPRISE,
    reports: variantId === VARIANT_IDS.ENTERPRISE,
    settings: true, // Available for all plans
  };

  return (
    <DashboardLayout
      overview={features.overview ? <Overview /> : null}
      analytics={features.analytics ? <Analytics /> : null}
      reports={features.reports ? <Reports /> : null}
      settings={features.settings ? <Settings /> : null}
      variantId={variantId}
    />
  );
} 