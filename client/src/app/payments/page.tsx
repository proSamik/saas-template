'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

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

const PaymentsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ProductsResponse>('/api/products');
        setProducts(data.data);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        setError(error?.response?.data?.message || 'Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubscribe = async (productId: string, variantId: string) => {
    if (!variantId) {
      toast.error('This product is currently unavailable for purchase');
      return;
    }

    setLoadingStates(prevStates => {
      const newStates = new Map(prevStates);
      newStates.set(productId, true);
      return newStates;
    });
    try {
      const { data } = await api.post('/api/checkout', {
        productId,
        variantId,
        email: session?.user?.email,
        userId: session?.user?.id,
      });
      
      if (data.checkoutURL) {
        window.location.href = data.checkoutURL;
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

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in to access this page</p>
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
                onClick={() => handleSubscribe(product.id, productVariant?.id || '')}
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