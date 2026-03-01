export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const uid = url.searchParams.get('uid');
        if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });

        await dbConnect();
        const user = await User.findOne({ firebaseUid: uid });
        if (!user) return NextResponse.json({ addresses: [] });

        return NextResponse.json({ addresses: user.addresses || [] });
    } catch (error: any) {
        console.error('Fetch Addresses API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { uid, address } = body;

        if (!uid || !address) return NextResponse.json({ error: 'UID and address required' }, { status: 400 });

        await dbConnect();
        const user = await User.findOne({ firebaseUid: uid });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        user.addresses = user.addresses || [];
        user.addresses.push(address);
        await user.save();

        return NextResponse.json({ success: true, addresses: user.addresses });
    } catch (error: any) {
        console.error('Add Address API Error:', error);
        return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { uid, addressId } = body;

        if (!uid || !addressId) return NextResponse.json({ error: 'UID and Address ID required' }, { status: 400 });

        await dbConnect();
        const user = await User.findOne({ firebaseUid: uid });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Match by _id (MongoDB ObjectId) or by numeric id field
        const before = user.addresses.length;
        user.addresses = user.addresses.filter((a: any) => {
            const mongoId = a._id ? a._id.toString() : '';
            const numericId = a.id ? String(a.id) : '';
            return mongoId !== addressId && numericId !== addressId;
        });

        if (user.addresses.length === before) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        await user.save();
        console.log(`[ADDRESS] Deleted address ${addressId} for user ${uid}`);
        return NextResponse.json({ success: true, addresses: user.addresses });
    } catch (error: any) {
        console.error('Delete Address API Error:', error);
        return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
    }
}
