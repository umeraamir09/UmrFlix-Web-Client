import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/apiAuth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
