export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { validateRole, AuthError } from '@/lib/roleMiddleware';

export async function GET(req: Request) {
    try {
        await validateRole(req, ['admin']);
        await dbConnect();

        const deliveryUsers = await User.find({ role: 'delivery' })
            .select('firebaseUid email name phone')
            .lean();

        const formatted = deliveryUsers.map((u: any) => ({
            id: u.firebaseUid,
            name: u.name || u.email?.split('@')[0],
            email: u.email,
            phone: u.phone || ''
        }));

        return NextResponse.json({ deliveryUsers: formatted });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Delivery Users GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
