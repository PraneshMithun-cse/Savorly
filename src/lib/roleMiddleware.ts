import { decodeJwt } from 'jose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export interface AuthResult {
    uid: string;
    email: string;
    role: string;
}

/**
 * Validates a Firebase ID token and returns the user's role from MongoDB.
 * Throws an error if the token is invalid or the user doesn't have the required role.
 */
export async function validateRole(
    request: Request,
    allowedRoles: string[]
): Promise<AuthResult> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthError('Missing or invalid Authorization header', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
        throw new AuthError('Missing token', 401);
    }

    // Decode the Firebase JWT token
    let decoded;
    try {
        decoded = decodeJwt(token);
    } catch (e) {
        throw new AuthError('Invalid or expired token', 403);
    }

    const userId = decoded.user_id as string;
    const email = (decoded.email as string) || '';

    if (!userId) {
        throw new AuthError('Invalid token: no user_id', 403);
    }

    // Look up user role in MongoDB
    await dbConnect();
    const user = await User.findOne({ firebaseUid: userId });

    const role = user?.role || 'user';

    if (!allowedRoles.includes(role)) {
        throw new AuthError(`Access denied. Required roles: ${allowedRoles.join(', ')}`, 403);
    }

    return { uid: userId, email: email || user?.email || '', role };
}

export class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}
