export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { validateRole, AuthError } from '@/lib/roleMiddleware';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await validateRole(req, ['admin']);
        await dbConnect();

        const { id } = await params;
        const { deliveryPersonId } = await req.json();

        if (!deliveryPersonId) {
            return NextResponse.json({ error: 'deliveryPersonId is required' }, { status: 400 });
        }

        // Verify the delivery person exists and has the correct role
        const deliveryUser = await User.findOne({ firebaseUid: deliveryPersonId, role: 'delivery' });
        if (!deliveryUser) {
            return NextResponse.json({ error: 'Delivery person not found or not a delivery user' }, { status: 404 });
        }

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Update delivery assignment
        order.deliveryPersonId = deliveryPersonId;
        order.deliveryStatus = 'Assigned';
        order.updatedAt = new Date();

        // Log assignment
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({
            status: `Assigned to ${deliveryUser.name || deliveryUser.email}`,
            updatedBy: auth.email,
            role: 'admin',
            timestamp: new Date()
        });

        await order.save();

        return NextResponse.json({
            success: true,
            message: `Order assigned to ${deliveryUser.name || deliveryUser.email}`,
            deliveryPerson: {
                id: deliveryUser.firebaseUid,
                name: deliveryUser.name,
                email: deliveryUser.email
            }
        });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Admin Order Assign Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
