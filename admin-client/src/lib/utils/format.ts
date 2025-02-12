// Consistent date formatting for both server and client
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return '';
  }
};

// Format currency consistently
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format number with commas
export const formatNumber = (num: number | null | undefined): string => {
  if (num == null) return '';
  return new Intl.NumberFormat('en-US').format(num);
};

// Safe string formatter
export const formatString = (str: string | null | undefined): string => {
  return str || '';
}; 