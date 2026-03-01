export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { validateRole, AuthError } from '@/lib/roleMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// GET - List all users with admin or delivery roles
export async function GET(req: Request) {
    try {
        await validateRole(req, ['admin']);
        await dbConnect();

        const roleUsers = await User.find({ role: { $in: ['admin', 'delivery'] } })
            .select('email name role createdAt')
            .sort({ role: 1, createdAt: -1 })
            .lean();

        return NextResponse.json({
            users: roleUsers.map((u: any) => ({
                id: u._id.toString(),
                email: u.email,
                name: u.name || u.email?.split('@')[0],
                role: u.role,
                addedAt: u.createdAt
            }))
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('GET roles error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH - Set a user's role by email
export async function PATCH(req: Request) {
    try {
        const auth = await validateRole(req, ['admin']);
        const { email, role } = await req.json();

        if (!email || !role) {
            return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
        }
        if (!['admin', 'delivery', 'user'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role. Must be admin, delivery, or user' }, { status: 400 });
        }

        await dbConnect();

        // Find or create the user
        let user = await User.findOne({ email: email.toLowerCase().trim() });

        if (user) {
            user.role = role;
            await user.save();
        } else {
            // Create a placeholder user entry
            user = await User.create({
                firebaseUid: `pending_${Date.now()}`,
                email: email.toLowerCase().trim(),
                name: email.split('@')[0],
                role: role
            });
        }

        return NextResponse.json({
            success: true,
            message: `Role "${role}" assigned to ${email}`,
            user: { email: user.email, role: user.role, name: user.name }
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('PATCH roles error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
