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
        const auth = await validateRole(req, ['delivery']);
        await dbConnect();

        const { id } = await params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const validStatuses = ['Picked Up', 'On The Way', 'Delivered', 'Failed Delivery'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify this order is assigned to the current delivery person
        if (order.deliveryPersonId !== auth.uid) {
            return NextResponse.json({ error: 'This order is not assigned to you' }, { status: 403 });
        }

        // Prevent updates to already delivered orders
        if (order.deliveryStatus === 'Delivered') {
            return NextResponse.json({ error: 'Order already delivered — cannot modify' }, { status: 400 });
        }

        // Update delivery status
        order.deliveryStatus = status;
        order.updatedAt = new Date();

        // Log status change
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({
            status: `Delivery: ${status}`,
            updatedBy: auth.email,
            role: 'delivery',
            timestamp: new Date()
        });

        // If delivered — finalize the order
        if (status === 'Delivered') {
            order.orderStatus = 'Delivered';
            order.status = 'delivered';
            order.deliveredAt = new Date();
        }

        await order.save();

        return NextResponse.json({
            success: true,
            message: `Delivery status updated to ${status}`,
            orderId: order._id,
            deliveryStatus: order.deliveryStatus,
            orderStatus: order.orderStatus
        });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Delivery Status Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
