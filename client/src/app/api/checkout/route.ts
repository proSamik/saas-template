import { NextResponse } from 'next/server';
import { client } from '@/lib/lemons';
import { auth } from '../auth/[...nextauth]/route';
import { Session } from 'next-auth';

type AuthSession = Session & {
  user?: {
    id: string;
    email?: string;
  };
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, productId, variantId } = await request.json();

    let variant;
    if (variantId) {
      variant = { id: variantId };
    } else {
      const variants = await client.listAllVariants({ productId });
      variant = variants.data[0];
    }

    if (!variant) {
      return NextResponse.json({ error: 'Product variant not found' }, { status: 404 });
    }

    const checkout = await client.createCheckout({
      store: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID as string,
      variant: variant.id,
      checkout_data: {
        email,
        custom: {
          user_id: session.user.id
        }
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