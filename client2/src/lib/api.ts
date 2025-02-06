import { config } from '@/config/api';
import { Product, CheckoutRequest, CheckoutResponse, ApiError } from '@/types/api';
import { Session } from 'next-auth';

interface ApiRequestInit extends RequestInit {
    session?: Session | null;
}

async function fetchWithAuth(url: string, init: ApiRequestInit = {}): Promise<Response> {
    const { session, ...restInit } = init;
    const headers = new Headers(restInit.headers);

    if (session?.user?.accessToken) {
        headers.set('Authorization', `Bearer ${session.user.accessToken}`);
    }

    return fetch(`${config.baseUrl}${url}`, {
        ...restInit,
        headers
    });
}

async function handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
            message: 'An unexpected error occurred',
            status: response.status
        }));
        throw error;
    }
    return response.json();
}

export async function getProducts(session?: Session | null): Promise<Product[]> {
    try {
        const response = await fetchWithAuth(config.apiEndpoints.products, { session });
        return handleApiResponse<Product[]>(response);
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

export async function getProduct(productId: string, session?: Session | null): Promise<Product> {
    try {
        const response = await fetchWithAuth(`${config.apiEndpoints.products}/${productId}`, { session });
        return handleApiResponse<Product>(response);
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        throw error;
    }
}

export async function createCheckout(data: CheckoutRequest, session?: Session | null): Promise<CheckoutResponse> {
    try {
        const response = await fetchWithAuth(config.apiEndpoints.checkout, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            session
        });
        return handleApiResponse<CheckoutResponse>(response);
    } catch (error) {
        console.error('Error creating checkout:', error);
        throw error;
    }
}