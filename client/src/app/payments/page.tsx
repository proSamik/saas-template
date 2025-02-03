'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth';

// Types
interface ProductAttributes {
  name: string;
  description: string;
  price: number;
  price_formatted: string;
  thumb_url: string;
  status: string;
  store_id: number;
}

interface Variant {
  id: string;
  attributes: {
    status: string;
    name: string;
    price: number;
    price_formatted: string;
  };
}

interface Product {
  type: string;
  id: string;
  attributes: ProductAttributes;
  relationships: {
    variants: {
      data: Variant[];
      links: {
        href: string;
      };
    };
  };
}

interface ProductsResponse {
  data: Product[];
}

// Component
const PaymentsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.get<ProductsResponse>('/api/products');
        setProducts(response.data);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        setError(error?.response?.data?.message || 'Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle product purchase/subscription
  const handlePurchase = async (productId: string, variantId: string) => {
    if (!variantId) {
      toast.error('This product is currently unavailable for purchase');
      return;
    }

    // If user is not authenticated, redirect to login
    if (!isAuthenticated) {
      // Store the product info in sessionStorage for after login
      sessionStorage.setItem('pendingPurchase', JSON.stringify({ productId, variantId }));
      router.push('/auth/login');
      return;
    }

    // Proceed with checkout for authenticated users
    setLoadingStates(prevStates => {
      const newStates = new Map(prevStates);
      newStates.set(productId, true);
      return newStates;
    });

    try {
      const response = await authService.post('/api/checkout', {
        productId,
        variantId,
        email: user?.email,
        userId: user?.id,
      });

      const data = response.data;
      if (data.checkoutURL) {
        window.open(data.checkoutURL, '_blank');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error?.response?.data?.message || 'Failed to process checkout. Please try again.');
    } finally {
      setLoadingStates(prevStates => {
        const newStates = new Map(prevStates);
        newStates.set(productId, false);
        return newStates;
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Choose Your Plan</h1>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {products.map((product) => {
          const productVariant = product.relationships?.variants?.data
            ? product.relationships.variants.data.find(variant => variant.attributes?.status === 'published') || null
            : null;
          const isAvailable = product.attributes.status === 'published' && productVariant !== null;
          
          return (
            <div key={product.id} className="rounded-lg border p-6 shadow-lg">
              {product.attributes.thumb_url && (
                <img 
                  src={product.attributes.thumb_url} 
                  alt={product.attributes.name}
                  className="mb-4 h-32 w-32 object-contain"
                />
              )}
              <h2 className="mb-4 text-xl font-semibold">{product.attributes.name}</h2>
              <div 
                className="mb-4 text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.attributes.description }}
              />
              <p className="mb-6 text-2xl font-bold">{product.attributes.price_formatted}</p>
              <button
                onClick={() => handlePurchase(product.id, productVariant?.id || '')}
                disabled={loadingStates.get(product.id) || !isAvailable}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingStates.get(product.id)
                  ? 'Processing...'
                  : !isAvailable
                    ? 'Currently Unavailable'
                    : product.attributes.price_formatted.includes('/month')
                      ? 'Subscribe'
                      : 'Order Now'
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentsPage;