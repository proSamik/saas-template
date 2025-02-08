'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { authService } from '@/services/auth';

export default function PageView() {
  const pathname = usePathname();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await authService.post('/api/analytics/pageview', {
          path: pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language
        });
        console.log('[Analytics] Page view tracked:', pathname);
      } catch (error) {
        // Silently handle errors to not disrupt user experience
        console.error('[Analytics] Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [pathname]);

  // This component doesn't render anything
  return null;
}