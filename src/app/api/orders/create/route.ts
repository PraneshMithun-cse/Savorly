export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { validateRole, AuthError } from '@/lib/roleMiddleware';
import { validateOrderPayload, checkPayloadSize } from '@/lib/validate';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export async function POST(req: Request) {
    try {
        // Rate limiting
        const ip = getClientIP(req);
        const rl = checkRateLimit(ip, 'payment');
        if (rl.limited) {
            return NextResponse.json(
                { error: 'Too many requests. Try again later.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        // Auth guard — require logged-in user
        let auth: { uid: string; email: string; role: string };
        try {
            auth = await validateRole(req, ['user', 'admin']);
        } catch (error: any) {
            if (error instanceof AuthError) {
                return NextResponse.json({ error: error.message }, { status: error.status });
            }
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();

        // Payload size check
        if (!checkPayloadSize(body)) {
            return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
        }

        // Validate order payload
        const validation = validateOrderPayload(body);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const { items, totalAmount, paymentMethod, customer, coupon, subtotal, discount } = validation.data;

        await dbConnect();

        // Idempotency: check for duplicate orders in last 60 seconds
        const recentDuplicate = await Order.findOne({
            userId: auth.uid,
            totalAmount,
            createdAt: { $gte: new Date(Date.now() - 60_000) }
        });
        if (recentDuplicate) {
            console.warn(`[ORDER] Duplicate order blocked for user ${auth.uid}`);
            return NextResponse.json({
                message: 'success',
                id: recentDuplicate._id.toString(),
                method: recentDuplicate.paymentMethod === 'cod' ? 'cod' : 'online',
                duplicate: true
            });
        }

        // COD Orders
        if (paymentMethod === 'cod') {
            const order = await Order.create({
                userId: auth.uid,
                userEmail: auth.email,
                items, totalAmount,
                paymentMethod: 'cod',
                paymentStatus: 'pending',
                customer, status: 'processing',
                coupon, subtotal, discount
            });
            console.log(`[ORDER] COD order created: ${order._id} by ${auth.uid}`);
            return NextResponse.json({ message: 'success', id: order._id.toString(), method: 'cod' });
        }

        // Online Payment (Razorpay)
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: `rcpt_${auth.uid.substring(0, 8)}_${Date.now()}`,
        });

        const order = await Order.create({
            userId: auth.uid,
            userEmail: auth.email,
            items, totalAmount,
            paymentMethod: paymentMethod || 'razorpay',
            paymentStatus: 'pending',
            razorpayOrderId: razorpayOrder.id,
            customer, status: 'processing',
            coupon, subtotal, discount
        });

        console.log(`[ORDER] Online order created: ${order._id}, razorpay: ${razorpayOrder.id}`);
        return NextResponse.json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
            dbOrderId: order._id.toString(),
            method: 'online'
        });

    } catch (error) {
        console.error('[ORDER] Creation Error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
