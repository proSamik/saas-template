export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    variants: ProductVariant[];
}

export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    description: string;
}

export interface CheckoutRequest {
    productId: string;
    variantId: string;
    email: string;
    userId: string;
}

export interface CheckoutResponse {
    checkoutURL: string;
}

export interface ApiError {
    message: string;
    status: number;
}