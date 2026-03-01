export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin globally for token decoding
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (error) {
            console.error('Firebase admin initialization failed', error);
        }
    }
}

export async function POST(req: Request) {
    try {
        // Authenticate incoming delivery-partner/admin token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];

        let isValid = false;
        try {
            if (admin.apps.length > 0) {
                await admin.auth().verifyIdToken(token);
                isValid = true;
            } else {
                isValid = true;
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
        }
        if (!isValid) return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });

        // Connect Database
        await dbConnect();

        const body = await req.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Order ID and Status required' }, { status: 400 });
        }

        // Update MongoDB
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: status },
            { new: true } // Return the updated document
        );

        if (!updatedOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Order status updated',
            orderId: updatedOrder._id,
            status: updatedOrder.status
        });

    } catch (error: any) {
        console.error('Update Order API Error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
