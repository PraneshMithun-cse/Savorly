export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Decode the Firebase JWT token to get the user ID
        const decoded = decodeJwt(token);
        const userId = decoded.user_id as string;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        await dbConnect();

        // Fetch orders and sort by newest first
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

        // Format for the frontend
        const formattedOrders = orders.map((o: any) => ({
            orderId: o._id.toString(),
            timestamp: o.createdAt.toISOString(),
            status: o.status,
            totalPrice: o.totalAmount,
            items: o.items.map((i: any) => ({
                planName: i.name,
                quantity: i.quantity,
                price: i.price
            }))
        }));

        return NextResponse.json({ orders: formattedOrders });

    } catch (error) {
        console.error('Fetch Orders Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
