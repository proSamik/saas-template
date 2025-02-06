export const config = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    apiEndpoints: {
        products: '/api/products',
        checkout: '/api/checkout',
    }
};