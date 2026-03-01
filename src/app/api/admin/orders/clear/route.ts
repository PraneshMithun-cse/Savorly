export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { validateRole, AuthError } from '@/lib/roleMiddleware';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

// DELETE - Clear all orders
export async function DELETE(req: Request) {
    try {
        await validateRole(req, ['admin']);
        await dbConnect();

        const result = await Order.deleteMany({});

        return NextResponse.json({
            success: true,
            message: `Cleared ${result.deletedCount} orders`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('DELETE orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
