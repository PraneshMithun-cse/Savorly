export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { validateRole, AuthError } from '@/lib/roleMiddleware';
import { sanitizeString } from '@/lib/validate';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

export async function POST(req: Request) {
    try {
        // Rate limiting (strict for payment)
        const ip = getClientIP(req);
        const rl = checkRateLimit(ip, 'payment');
        if (rl.limited) {
            return NextResponse.json(
                { error: 'Too many requests. Try again later.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        // Auth guard
        let auth: { uid: string; email: string; role: string };
        try {
            auth = await validateRole(req, ['user', 'admin']);
        } catch (error: any) {
            if (error instanceof AuthError) {
                return NextResponse.json({ error: error.message }, { status: error.status });
            }
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            dbOrderId
        } = await req.json();

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.warn(`[PAYMENT] Missing fields from user ${auth.uid}`);
            return NextResponse.json({ message: 'fail', error: 'Missing required payment fields' }, { status: 400 });
        }

        // Sanitize inputs
        const orderId = sanitizeString(razorpay_order_id, 100);
        const paymentId = sanitizeString(razorpay_payment_id, 100);
        const signature = sanitizeString(razorpay_signature, 200);
        const orderDbId = sanitizeString(dbOrderId, 100);

        // Verify Razorpay signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            console.error('[PAYMENT] RAZORPAY_KEY_SECRET not configured');
            return NextResponse.json({ error: 'Payment system unavailable' }, { status: 500 });
        }

        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        await dbConnect();

        if (expectedSignature === signature) {
            // Update MongoDB Order
            if (orderDbId) {
                // Prevent replay: check if already paid
                const existing = await Order.findById(orderDbId);
                if (existing?.paymentStatus === 'paid') {
                    console.warn(`[PAYMENT] Replay attack blocked: order ${orderDbId} already paid`);
                    return NextResponse.json({
                        message: 'success',
                        orderId: orderId,
                        paymentId: paymentId,
                        note: 'Already processed'
                    });
                }

                // Verify the order belongs to this user
                if (existing && existing.userId !== auth.uid) {
                    console.warn(`[PAYMENT] User ${auth.uid} tried to verify order ${orderDbId} belonging to ${existing.userId}`);
                    return NextResponse.json({ message: 'fail', error: 'Unauthorized' }, { status: 403 });
                }

                await Order.findByIdAndUpdate(orderDbId, {
                    paymentStatus: 'paid',
                    razorpayPaymentId: paymentId,
                    status: 'processing'
                });
            }

            console.log(`[PAYMENT] Verified: order=${orderId}, payment=${paymentId}, user=${auth.uid}`);
            return NextResponse.json({
                message: 'success',
                orderId: orderId,
                paymentId: paymentId,
            });
        } else {
            // Signature mismatch — potential tampering
            console.error(`[PAYMENT] Signature mismatch for order ${orderId} by user ${auth.uid}`);
            if (orderDbId) {
                await Order.findByIdAndUpdate(orderDbId, { paymentStatus: 'failed' });
            }
            return NextResponse.json({ message: 'fail', error: 'Payment verification failed' }, { status: 400 });
        }

    } catch (error) {
        console.error('[PAYMENT] Verification Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
