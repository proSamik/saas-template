'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ProductAttributes {
  name: string;
  description: string;
  price: number;
  price_formatted: string;
  thumb_url: string;
  status: string;
}

interface Product {
  type: string;
  id: string;
  attributes: ProductAttributes;
}

interface ProductsResponse {
  data: Product[];
}

const PaymentsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://api.lemonsqueezy.com/v1/products', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LEMONSQUEEZY_API_KEY}`,
          },
        });
        const data: ProductsResponse = await response.json();
        setProducts(data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const handleSubscribe = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          email: session?.user?.email,
        }),
      });
  
      const data = await response.json();
      if (data.checkoutURL) {
        window.location.href = data.checkoutURL;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
        {products.map((product) => (
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
              onClick={() => handleSubscribe(product.id)}
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentsPage;