export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { validateRole, AuthError } from '@/lib/roleMiddleware';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await validateRole(req, ['admin']);
        await dbConnect();

        const { id } = await params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const validStatuses = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Prevent updates to already delivered/cancelled orders
        if (['Delivered', 'Cancelled'].includes(order.orderStatus) && status !== order.orderStatus) {
            return NextResponse.json({ error: `Cannot change status of ${order.orderStatus} order` }, { status: 400 });
        }

        // Update order
        order.orderStatus = status;
        order.status = status.toLowerCase();
        order.updatedAt = new Date();

        // Log status change
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({
            status,
            updatedBy: auth.email,
            role: 'admin',
            timestamp: new Date()
        });

        // Mark delivered
        if (status === 'Delivered') {
            order.deliveredAt = new Date();
            order.deliveryStatus = 'Delivered';
        }

        await order.save();

        return NextResponse.json({
            success: true,
            message: `Order status updated to ${status}`,
            orderId: order._id,
            orderStatus: order.orderStatus
        });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Admin Order Status Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
