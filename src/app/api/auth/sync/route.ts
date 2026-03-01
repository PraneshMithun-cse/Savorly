export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sanitizeString, validateEmail } from '@/lib/validate';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

// Admin and delivery emails from env vars (comma-separated) or fallback
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@savourly.in,asavorly@gmail.com')
    .split(',').map(e => e.trim().toLowerCase());
const DELIVERY_EMAILS = (process.env.DELIVERY_EMAILS || 'delivery@savourly.in')
    .split(',').map(e => e.trim().toLowerCase());

export async function POST(req: Request) {
    try {
        // Rate limiting
        const ip = getClientIP(req);
        const rl = checkRateLimit(ip, 'auth');
        if (rl.limited) {
            return NextResponse.json(
                { error: 'Too many requests. Try again later.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        const body = await req.json();
        const uid = sanitizeString(body.uid, 128);
        const email = validateEmail(body.email);

        if (!uid || !email) {
            return NextResponse.json({ error: 'Missing required user data' }, { status: 400 });
        }

        const displayName = sanitizeString(body.displayName, 100);
        const photoURL = sanitizeString(body.photoURL, 500);
        const phone = sanitizeString(body.phone, 15);

        await dbConnect();

        // Determine role
        let role = 'user';
        if (ADMIN_EMAILS.includes(email)) role = 'admin';
        else if (DELIVERY_EMAILS.includes(email)) role = 'delivery';

        // Upsert user
        let user = await User.findOne({ firebaseUid: uid });

        if (user) {
            user.email = email;
            user.name = displayName || user.name;
            user.profilePic = photoURL || user.profilePic;
            user.phone = phone || user.phone;
            user.role = role;
            await user.save();
        } else {
            user = await User.create({
                firebaseUid: uid,
                email,
                name: displayName || email.split('@')[0],
                profilePic: photoURL,
                phone,
                role
            });
            console.log(`[AUTH] New user created: ${email} (${role})`);
        }

        // Transfer localStorage addresses on login (sent from frontend)
        if (body.localAddresses && Array.isArray(body.localAddresses) && body.localAddresses.length > 0) {
            const existingIds = new Set((user.addresses || []).map((a: any) => String(a.id || a._id)));
            let added = 0;
            for (const addr of body.localAddresses.slice(0, 10)) { // Max 10
                const addrId = String(addr.id || Date.now() + added);
                if (!existingIds.has(addrId)) {
                    user.addresses.push({
                        label: sanitizeString(addr.label, 20) || 'Home',
                        name: sanitizeString(addr.name, 100),
                        phone: sanitizeString(addr.phone, 15),
                        doorNo: sanitizeString(addr.doorNo, 50),
                        apartment: sanitizeString(addr.apartment, 100),
                        street: sanitizeString(addr.street, 200),
                        line1: sanitizeString(addr.line1, 200),
                        landmark: sanitizeString(addr.landmark, 200),
                        city: sanitizeString(addr.city, 100),
                        state: sanitizeString(addr.state, 50) || 'Tamil Nadu',
                        pincode: sanitizeString(addr.pincode, 10)
                    });
                    added++;
                }
            }
            if (added > 0) {
                await user.save();
                console.log(`[AUTH] Transferred ${added} localStorage addresses for ${email}`);
            }
        }

        return NextResponse.json({ message: 'User synced', data: user });

    } catch (error) {
        console.error('[AUTH] Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
