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

export async function GET(req: Request) {
    try {
        // Authenticate the incoming Firebase ID token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];

        // Very basic mock decoding block if strict keys aren't mounted during this build
        // In full production, require Firebase Admin VerifyToken
        let isValid = false;
        try {
            if (admin.apps.length > 0) {
                await admin.auth().verifyIdToken(token);
                isValid = true;
            } else {
                isValid = true; // Fallback for local demo
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
        }

        if (!isValid) return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });

        // Connect to MongoDB
        await dbConnect();

        // Support '?limit=50' query parameters
        const url = new URL(req.url);
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 100;

        // Fetch orders and sort by newest first
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(); // Faster vanilla JS objects

        // Transform data into the shape admin-logic.js expects
        const formattedOrders = orders.map((order: any) => ({
            _id: order._id.toString(),
            orderId: (order._id.toString().substring(0, 8)).toUpperCase(),
            userId: order.userId,
            timestamp: order.createdAt,
            customerDetails: {
                name: order.customer?.name || order.userEmail?.split('@')[0] || 'Guest',
                phone: order.customer?.phone || 'N/A',
                address: order.customer?.address || 'N/A'
            },
            items: order.items.map((item: any) => ({
                planName: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalPrice: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            status: order.status || 'processing'
        }));

        return NextResponse.json({
            count: formattedOrders.length,
            orders: formattedOrders
        });

    } catch (error: any) {
        console.error('Get Orders API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
