import { NextResponse } from 'next/server';
import { client } from '@/lib/lemons';

export async function POST(request: Request) {
  try {
    const { email, productId } = await request.json();

    const variant = (
      await client.listAllVariants({ productId })
    ).data[0];

    if (!variant) {
      return NextResponse.json({ error: 'Product variant not found' }, { status: 404 });
    }

    const checkout = await client.createCheckout({
      store: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID as string,
      variant: variant.id,
      checkout_data: {
        email,
      },
    });

    return NextResponse.json({ checkoutURL: checkout.data.attributes.url }, { status: 201 });
  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}