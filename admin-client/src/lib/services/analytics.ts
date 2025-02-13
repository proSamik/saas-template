import { API_URL } from '@/lib/config';
import { getAuthToken } from './auth';

export interface PageView {
  id: string;
  user_id?: string;
  visitor_id?: string;
  path: string;
  referrer?: string;
  user_agent: string;
  ip_address: string;
  created_at: string;
}

export interface JourneyRequest {
  user_id?: string;
  visitor_id?: string;
  start_time: string;
  end_time: string;
}

export interface AnalyticsStats {
  total_page_views: number;
  unique_visitors: number;
  popular_pages: Array<{
    path: string;
    view_count: number;
  }>;
  visitors_by_day: Array<{
    date: string;
    visitors: number;
  }>;
  referrer_stats: Array<{
    referrer: string;
    count: number;
  }>;
}

const headers = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

export const getUserJourney = async (userId: string, startTime: string, endTime: string): Promise<PageView[]> => {
  const response = await fetch(
    `${API_URL}/admin/analytics/user-journey`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ 
        user_id: userId, 
        start_time: startTime, 
        end_time: endTime 
      } as JourneyRequest),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user journey');
  }

  return response.json();
};

export const getVisitorJourney = async (visitorId: string, startTime: string, endTime: string): Promise<PageView[]> => {
  const response = await fetch(
    `${API_URL}/admin/analytics/visitor-journey`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ 
        visitor_id: visitorId, 
        start_time: startTime, 
        end_time: endTime 
      } as JourneyRequest),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch visitor journey');
  }

  return response.json();
}; 