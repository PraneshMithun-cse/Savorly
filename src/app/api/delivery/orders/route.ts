export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { validateRole, AuthError } from '@/lib/roleMiddleware';

export async function GET(req: Request) {
    try {
        const auth = await validateRole(req, ['delivery']);
        await dbConnect();

        // Fetch all orders so delivery partners see everything
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .lean();

        const formatted = orders.map((order: any) => ({
            _id: order._id.toString(),
            orderId: order._id.toString().slice(-8).toUpperCase(),
            customer: order.customer || {},
            items: order.items || [],
            totalAmount: order.totalAmount || 0,
            orderStatus: order.orderStatus || order.status || 'Placed',
            deliveryStatus: order.deliveryStatus || 'Assigned',
            paymentMethod: order.paymentMethod || 'N/A',
            paymentStatus: order.paymentStatus || 'pending',
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
        }));

        return NextResponse.json({ orders: formatted });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Delivery Orders GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
