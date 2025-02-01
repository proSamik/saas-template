import { NextResponse } from 'next/server';
import { auth } from '../auth/[...nextauth]/route';
import api from '@/lib/axios';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, productId, variantId, userId } = await request.json();

    const response = await api.post('/api/checkout', {
      email,
      productId,
      variantId,
      userId
    });

    return NextResponse.json({ checkoutURL: response.data.checkoutURL }, { status: 201 });
  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}