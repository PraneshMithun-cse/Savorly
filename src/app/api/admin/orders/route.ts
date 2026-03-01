export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { validateRole, AuthError } from '@/lib/roleMiddleware';

export async function GET(req: Request) {
    try {
        await validateRole(req, ['admin']);
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const statusFilter = searchParams.get('status');
        const paymentFilter = searchParams.get('payment');

        // Build query
        const query: any = {};
        if (statusFilter && statusFilter !== 'all') {
            query.$or = [
                { orderStatus: { $regex: new RegExp(statusFilter, 'i') } },
                { status: { $regex: new RegExp(statusFilter, 'i') } }
            ];
        }
        if (paymentFilter && paymentFilter !== 'all') {
            query.paymentStatus = paymentFilter;
        }

        const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

        // Format for frontend
        const formatted = orders.map((order: any) => ({
            _id: order._id.toString(),
            orderId: order._id.toString().slice(-8).toUpperCase(),
            userId: order.userId,
            userEmail: order.userEmail || 'N/A',
            items: order.items || [],
            totalAmount: order.totalAmount || 0,
            paymentMethod: order.paymentMethod || 'N/A',
            paymentStatus: order.paymentStatus || 'pending',
            orderStatus: order.orderStatus || order.status || 'Placed',
            deliveryPersonId: order.deliveryPersonId || '',
            deliveryStatus: order.deliveryStatus || '',
            statusHistory: order.statusHistory || [],
            customer: order.customer || {},
            subtotal: order.subtotal,
            discount: order.discount || 0,
            coupon: order.coupon,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        }));

        return NextResponse.json({ orders: formatted });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Admin Orders GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
