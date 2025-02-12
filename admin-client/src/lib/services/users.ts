import { API_URL } from '@/lib/config';
import { getAuthToken } from './auth';

export interface User {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

const headers = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}/admin/users`, {
    headers: headers(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

export const getUser = async (userId: string): Promise<User> => {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    headers: headers(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}; 